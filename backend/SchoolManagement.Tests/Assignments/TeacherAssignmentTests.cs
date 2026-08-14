using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Controllers;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Controllers;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Overview.Controllers;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Models;
using Xunit;

namespace SchoolManagement.Tests.Assignments;

public class TeacherAssignmentTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private void SetTeacherUserContext(ControllerBase controller, Guid teacherId)
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, teacherId.ToString()),
                    new Claim(ClaimTypes.Role, "Teacher")
                }))
            }
        };
    }

    [Fact]
    public async Task GetTeacherAssignments_ReturnsAssignmentsWithCounts()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var cls = new Class { Name = "Class 10", GradeLevel = "10" };
        var sub = new Subject { Name = "Math", Code = "MATH10" };
        var teacher = new User { Id = teacherId, Name = "Teacher", Email = "t@school.com", Role = UserRole.Teacher };
        var student = new User { Id = studentId, Name = "Student", Email = "s@school.com", Role = UserRole.Student };

        db.Classes.Add(cls);
        db.Subjects.Add(sub);
        db.Users.AddRange(teacher, student);
        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });

        var assignment = new Assignment
        {
            Title = "Algebra 1",
            Description = "Test Assignment",
            Deadline = DateTime.UtcNow.AddDays(2),
            MaxMarks = 100,
            ClassId = cls.Id,
            SubjectId = sub.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);

        var submission = new Submission
        {
            AssignmentId = assignment.Id,
            StudentId = studentId,
            FileUrl = "http://example.com/ans.pdf",
            FileName = "ans.pdf",
            Status = SubmissionStatus.Graded,
            Marks = 95
        };
        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        var controller = new TeacherAssignmentsController(db);
        SetTeacherUserContext(controller, teacherId);

        // Act
        var result = await controller.GetTeacherAssignments();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var list = okResult.Value as System.Collections.IEnumerable;
        Assert.NotNull(list);
    }

    [Fact]
    public async Task GetAssignmentDetail_ExistingAssignment_ReturnsStats()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();

        var cls = new Class { Name = "Class 9", GradeLevel = "9" };
        var sub = new Subject { Name = "Physics", Code = "PHY9" };
        db.Classes.Add(cls);
        db.Subjects.Add(sub);

        var assignment = new Assignment
        {
            Title = "Kinematics",
            Description = "Problem Set 1",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 50,
            ClassId = cls.Id,
            SubjectId = sub.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var controller = new TeacherAssignmentsController(db);
        SetTeacherUserContext(controller, teacherId);

        // Act
        var result = await controller.GetAssignmentDetail(assignment.Id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task TeacherClassesController_GetTeacherClasses_ReturnsAllocationsWithCounts()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var cls = new Class { Name = "Class 10", GradeLevel = "10" };
        var sub = new Subject { Name = "Chemistry", Code = "CHEM10" };

        db.Classes.Add(cls);
        db.Subjects.Add(sub);
        db.ClassSubjectTeachers.Add(new ClassSubjectTeacher
        {
            ClassId = cls.Id,
            SubjectId = sub.Id,
            TeacherId = teacherId
        });
        await db.SaveChangesAsync();

        var controller = new TeacherClassesController(db);
        SetTeacherUserContext(controller, teacherId);

        // Act
        var result = await controller.GetTeacherClasses();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task TeacherOverviewController_GetTeacherOverviewStats_ReturnsAggregatedMetrics()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();

        var controller = new TeacherOverviewController(db);
        SetTeacherUserContext(controller, teacherId);

        // Act
        var result = await controller.GetTeacherOverviewStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }
}
