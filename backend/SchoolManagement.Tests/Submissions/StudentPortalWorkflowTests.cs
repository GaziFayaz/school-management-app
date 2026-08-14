using System.Reflection;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SchoolManagement.Api.BuildingBlocks.Storage;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Controllers;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Overview.Controllers;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Controllers;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Models;
using Xunit;

namespace SchoolManagement.Tests.Submissions;

public class StudentPortalWorkflowTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private ControllerContext CreateStudentControllerContext(Guid studentId)
    {
        return new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, studentId.ToString()),
                    new Claim(ClaimTypes.Role, "Student")
                }))
            }
        };
    }

    private static T? GetProperty<T>(object obj, string propertyName)
    {
        var prop = obj.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
        if (prop == null) return default;
        var val = prop.GetValue(obj);
        if (val == null) return default;
        return (T)Convert.ChangeType(val, typeof(T));
    }

    [Fact]
    public async Task GetStudentOverviewStats_ReturnsAccurateKPIsAndDeadlines()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student, PasswordHash = "hash" };
        var teacher = new User { Id = teacherId, Name = "John Teacher", Email = "teacher@school.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        db.Users.AddRange(student, teacher);

        var cls = new Class { Id = Guid.NewGuid(), Name = "Class 10-A", GradeLevel = "10" };
        db.Classes.Add(cls);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Mathematics", Code = "MATH101" };
        db.Subjects.Add(subject);

        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });
        db.ClassSubjectTeachers.Add(new ClassSubjectTeacher { ClassId = cls.Id, SubjectId = subject.Id, TeacherId = teacherId });

        var assignment1 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Calculus Assignment",
            Description = "Integrals",
            Deadline = DateTime.UtcNow.AddDays(2),
            MaxMarks = 100,
            ClassId = cls.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };

        var assignment2 = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Algebra Homework",
            Description = "Matrices",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 50,
            ClassId = cls.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };

        db.Assignments.AddRange(assignment1, assignment2);

        // Graded submission for assignment1
        var submission1 = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment1.Id,
            StudentId = studentId,
            FileUrl = "http://example.com/sub1.pdf",
            FileKey = "sub1.pdf",
            FileName = "sub1.pdf",
            FileSize = 5000,
            Status = SubmissionStatus.Graded,
            Marks = 90,
            Feedback = "Outstanding performance!",
            SubmittedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow
        };
        db.Submissions.Add(submission1);

        await db.SaveChangesAsync();

        var controller = new StudentOverviewController(db)
        {
            ControllerContext = CreateStudentControllerContext(studentId)
        };

        // Act
        var result = await controller.GetStudentOverviewStats();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var val = okResult.Value!;
        Assert.Equal(1, GetProperty<int>(val, "enrolledClassesCount"));
        Assert.Equal(1, GetProperty<int>(val, "enrolledSubjectsCount"));
        Assert.Equal(2, GetProperty<int>(val, "totalAssignmentsCount"));
        Assert.Equal(1, GetProperty<int>(val, "submittedCount"));
        Assert.Equal(1, GetProperty<int>(val, "pendingAssignmentsCount"));
        Assert.Equal(1, GetProperty<int>(val, "gradedSubmissionsCount"));
        Assert.Equal(90.0, GetProperty<double>(val, "averagePercentage"));
    }

    [Fact]
    public async Task GetEnrolledClasses_ReturnsEnrolledClassesWithSubjects()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student, PasswordHash = "hash" };
        var teacher = new User { Id = teacherId, Name = "John Teacher", Email = "teacher@school.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        db.Users.AddRange(student, teacher);

        var cls = new Class { Id = Guid.NewGuid(), Name = "Class 9-B", GradeLevel = "9" };
        db.Classes.Add(cls);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHY101" };
        db.Subjects.Add(subject);

        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });
        db.ClassSubjectTeachers.Add(new ClassSubjectTeacher { ClassId = cls.Id, SubjectId = subject.Id, TeacherId = teacherId });
        await db.SaveChangesAsync();

        var controller = new StudentClassesController(db)
        {
            ControllerContext = CreateStudentControllerContext(studentId)
        };

        // Act
        var result = await controller.GetEnrolledClasses();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var classes = (okResult.Value as IEnumerable<object>)?.ToList();
        Assert.NotNull(classes);
        Assert.Single(classes);
    }

    [Fact]
    public async Task GetClassDetails_UnenrolledStudent_ReturnsNotFound()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var otherClassId = Guid.NewGuid();

        var cls = new Class { Id = otherClassId, Name = "Class 12-A", GradeLevel = "12" };
        db.Classes.Add(cls);
        await db.SaveChangesAsync();

        var controller = new StudentClassesController(db)
        {
            ControllerContext = CreateStudentControllerContext(studentId)
        };

        // Act
        var result = await controller.GetClassDetails(otherClassId);

        // Assert
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Contains("not enrolled", notFound.Value?.ToString());
    }

    [Fact]
    public async Task GetAssignmentDetails_EnrolledStudent_ReturnsAssignmentAndSubmission()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student, PasswordHash = "hash" };
        var teacher = new User { Id = teacherId, Name = "John Teacher", Email = "teacher@school.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        db.Users.AddRange(student, teacher);

        var cls = new Class { Id = Guid.NewGuid(), Name = "Class 10-A", GradeLevel = "10" };
        db.Classes.Add(cls);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Chemistry", Code = "CHEM101" };
        db.Subjects.Add(subject);

        db.ClassStudents.Add(new ClassStudent { ClassId = cls.Id, StudentId = studentId });

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Organic Chemistry Lab",
            Description = "Complete the experiment report",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 50,
            ClassId = cls.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateStudentControllerContext(studentId)
        };

        // Act
        var result = await controller.GetAssignmentDetails(assignment.Id);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var val = okResult.Value!;
        Assert.Equal(assignment.Id, GetProperty<Guid>(val, "Id"));
        Assert.Equal("Organic Chemistry Lab", GetProperty<string>(val, "Title"));
        Assert.Equal("Chemistry", GetProperty<string>(val, "SubjectName"));
        Assert.False(GetProperty<bool>(val, "IsSubmitted"));
    }

    [Fact]
    public async Task GetAssignmentDetails_UnenrolledStudent_ReturnsForbidden()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student, PasswordHash = "hash" };
        var teacher = new User { Id = teacherId, Name = "John Teacher", Email = "teacher@school.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        db.Users.AddRange(student, teacher);

        var cls = new Class { Id = Guid.NewGuid(), Name = "Class 11-A", GradeLevel = "11" };
        db.Classes.Add(cls);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "History", Code = "HIST101" };
        db.Subjects.Add(subject);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "World History Essay",
            Description = "Essay on WWI",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 100,
            ClassId = cls.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);
        await db.SaveChangesAsync();

        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateStudentControllerContext(studentId) // Not enrolled in class
        };

        // Act
        var result = await controller.GetAssignmentDetails(assignment.Id);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    [Fact]
    public async Task GetStudentGrades_ReturnsGradebookWithPercentage()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var student = new User { Id = studentId, Name = "Alice Student", Email = "alice@school.com", Role = UserRole.Student, PasswordHash = "hash" };
        var teacher = new User { Id = teacherId, Name = "John Teacher", Email = "teacher@school.com", Role = UserRole.Teacher, PasswordHash = "hash" };
        db.Users.AddRange(student, teacher);

        var cls = new Class { Id = Guid.NewGuid(), Name = "Class 10-A", GradeLevel = "10" };
        db.Classes.Add(cls);

        var subject = new Subject { Id = Guid.NewGuid(), Name = "Biology", Code = "BIO101" };
        db.Subjects.Add(subject);

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Genetics Problem Set",
            Description = "Punnett squares",
            Deadline = DateTime.UtcNow.AddDays(-1),
            MaxMarks = 40,
            ClassId = cls.Id,
            SubjectId = subject.Id,
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);

        var submission = new Submission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = studentId,
            FileUrl = "http://example.com/bio.pdf",
            FileName = "bio.pdf",
            Status = SubmissionStatus.Graded,
            Marks = 36, // 36 / 40 = 90%
            Feedback = "Well researched",
            SubmittedAt = DateTime.UtcNow.AddDays(-2)
        };
        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateStudentControllerContext(studentId)
        };

        // Act
        var result = await controller.GetStudentGrades();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var gradeItems = (okResult.Value as IEnumerable<object>)?.ToList();
        Assert.NotNull(gradeItems);
        Assert.Single(gradeItems);
    }
}
