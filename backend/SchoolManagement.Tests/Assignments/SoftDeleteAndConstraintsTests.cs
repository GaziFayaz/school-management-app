using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Allocations.Controllers;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Controllers;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Controllers;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Controllers;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Controllers;
using SchoolManagement.Api.Modules.Users.Models;
using Xunit;

namespace SchoolManagement.Tests.Assignments;

public class SoftDeleteAndConstraintsTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private void SetUserContext(ControllerBase controller, Guid userId, string role = "Admin")
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, role)
                }))
            }
        };
    }

    [Fact]
    public async Task DeleteAssignment_SoftDeletes_AndExcludesFromQueries()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var cls = new Class { Name = "Class 9", GradeLevel = "9" };
        var sub = new Subject { Name = "Physics", Code = "PHYS9" };
        db.Classes.Add(cls);
        db.Subjects.Add(sub);

        var assignment = new Assignment
        {
            Title = "Kinematics",
            Description = "Chapter 1",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 50,
            ClassId = cls.Id,
            SubjectId = sub.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var controller = new TeacherAssignmentsController(db);
        SetUserContext(controller, teacherId, "Teacher");

        // Act - Delete assignment
        var deleteResult = await controller.DeleteAssignment(assignment.Id);
        Assert.IsType<NoContentResult>(deleteResult);

        // Assert - Verify it is marked deleted in the DB
        var rawAssignment = await db.Assignments.IgnoreQueryFilters().FirstOrDefaultAsync(a => a.Id == assignment.Id);
        Assert.NotNull(rawAssignment);
        Assert.True(rawAssignment.IsDeleted);
        Assert.NotNull(rawAssignment.DeletedAt);

        // Assert - Verify it is filtered out from normal queries
        var activeAssignment = await db.Assignments.FirstOrDefaultAsync(a => a.Id == assignment.Id);
        Assert.Null(activeAssignment);
    }

    [Fact]
    public async Task AdminUsersController_GetUserDetail_SupportsMultiClassEnrollment()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student };

        var classA = new Class { Name = "Class 10-A", GradeLevel = "10" };
        var classB = new Class { Name = "Science Club", GradeLevel = "10" };

        db.Users.Add(student);
        db.Classes.AddRange(classA, classB);
        db.ClassStudents.AddRange(
            new ClassStudent { ClassId = classA.Id, StudentId = studentId },
            new ClassStudent { ClassId = classB.Id, StudentId = studentId }
        );
        await db.SaveChangesAsync();

        var controller = new AdminUsersController(db);
        SetUserContext(controller, Guid.NewGuid(), "Admin");

        // Act
        var result = await controller.GetUserDetail(studentId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var options = new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
        var json = System.Text.Json.JsonSerializer.Serialize(okResult.Value, options);
        using var doc = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;
        
        Assert.True(root.TryGetProperty("roleDetails", out var roleDetails));
        Assert.True(roleDetails.TryGetProperty("enrolledClass", out var enrolledClass));
        Assert.True(roleDetails.TryGetProperty("enrolledClasses", out var enrolledClasses));
        Assert.Equal(2, enrolledClasses.GetArrayLength());
        Assert.NotNull(enrolledClass.GetProperty("className").GetString());
    }

    [Fact]
    public async Task SoftDeleteUser_ExcludesUser_FromListAndAllocations()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, Name = "Deleted Student", Email = "deleted@school.com", Role = UserRole.Student };
        var cls = new Class { Name = "Class 8", GradeLevel = "8" };
        db.Users.Add(student);
        db.Classes.Add(cls);
        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });
        await db.SaveChangesAsync();

        var controller = new AdminUsersController(db);
        SetUserContext(controller, Guid.NewGuid(), "Admin");

        // Act - Soft Delete user
        var deleteResult = await controller.DeleteUser(studentId);
        Assert.IsType<NoContentResult>(deleteResult);

        // Assert - Excluded from active queries
        var activeUsers = await db.Users.ToListAsync();
        Assert.DoesNotContain(activeUsers, u => u.Id == studentId);

        // Assert - Excluded from junction query filter
        var activeEnrollments = await db.ClassStudents.ToListAsync();
        Assert.DoesNotContain(activeEnrollments, cs => cs.StudentId == studentId);
    }

    [Fact]
    public async Task AdminAllocationsController_DuplicateEnrollment_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var student = new User { Id = studentId, Name = "Bob", Email = "bob@school.com", Role = UserRole.Student };
        var cls = new Class { Name = "Class 7", GradeLevel = "7" };

        db.Users.Add(student);
        db.Classes.Add(cls);
        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });
        await db.SaveChangesAsync();

        var controller = new AdminAllocationsController(db);
        SetUserContext(controller, Guid.NewGuid(), "Admin");

        // Act - Attempt enrolling again
        var result = await controller.EnrollStudent(new EnrollStudentDto(cls.Id, studentId));

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }
}
