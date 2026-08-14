using System.IO;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using SchoolManagement.Api.BuildingBlocks.Exceptions;
using SchoolManagement.Api.BuildingBlocks.Storage;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Controllers;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Controllers;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Controllers;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Controllers;
using SchoolManagement.Api.Modules.Users.Models;
using Xunit;

namespace SchoolManagement.Tests.Validation;

public class ValidationAndResilienceTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private ControllerContext CreateUserContext(Guid userId, string role)
    {
        return new ControllerContext
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

    private IFormFile CreateMockPdfFile(string fileName, byte[] content)
    {
        var stream = new MemoryStream(content);
        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(f => f.FileName).Returns(fileName);
        fileMock.Setup(f => f.Length).Returns(content.Length);
        fileMock.Setup(f => f.OpenReadStream()).Returns(stream);
        return fileMock.Object;
    }

    [Fact]
    public async Task SubmitAssignment_StudentNotEnrolled_Returns403Forbidden()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var classEntity = new Class { Id = Guid.NewGuid(), Name = "Grade 10 - Science", GradeLevel = "10" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Physics", Code = "PHY101" };
        var teacher = new User { Id = Guid.NewGuid(), Name = "Teacher Smith", Email = "smith@school.com", PasswordHash = "hash", Role = UserRole.Teacher };
        var student = new User { Id = Guid.NewGuid(), Name = "Alice Doe", Email = "alice@student.com", PasswordHash = "hash", Role = UserRole.Student };

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Physics Motion Lab",
            Description = "Submit lab report",
            Deadline = DateTime.UtcNow.AddDays(2),
            MaxMarks = 100,
            ClassId = classEntity.Id,
            SubjectId = subject.Id,
            TeacherId = teacher.Id,
            Status = AssignmentStatus.Published
        };

        db.Classes.Add(classEntity);
        db.Subjects.Add(subject);
        db.Users.AddRange(teacher, student);
        db.Assignments.Add(assignment);
        // NOTE: Alice is NOT added to ClassStudents
        await db.SaveChangesAsync();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateUserContext(student.Id, "Student")
        };

        // Act
        var pdfBytes = Encoding.UTF8.GetBytes("%PDF-1.4 Mock PDF Content");
        var formFile = CreateMockPdfFile("lab_report.pdf", pdfBytes);

        var result = await controller.SubmitAssignment(assignment.Id, formFile);

        // Assert
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(403, objectResult.StatusCode);
    }

    [Fact]
    public async Task SubmitAssignment_InvalidMagicBytes_Returns400BadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var classEntity = new Class { Id = Guid.NewGuid(), Name = "Grade 10 - Math", GradeLevel = "10" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Algebra", Code = "ALG101" };
        var student = new User { Id = Guid.NewGuid(), Name = "Bob Student", Email = "bob@student.com", PasswordHash = "hash", Role = UserRole.Student };
        var teacher = new User { Id = Guid.NewGuid(), Name = "Teacher Smith", Email = "smith@school.com", PasswordHash = "hash", Role = UserRole.Teacher };

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Math Homework",
            Description = "Problem set 1",
            Deadline = DateTime.UtcNow.AddDays(3),
            MaxMarks = 50,
            ClassId = classEntity.Id,
            SubjectId = subject.Id,
            TeacherId = teacher.Id,
            Status = AssignmentStatus.Published
        };

        db.Classes.Add(classEntity);
        db.Subjects.Add(subject);
        db.Users.AddRange(student, teacher);
        db.Assignments.Add(assignment);
        db.ClassStudents.Add(new ClassStudent { ClassId = classEntity.Id, StudentId = student.Id });
        await db.SaveChangesAsync();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateUserContext(student.Id, "Student")
        };

        // Act: Upload a file named .pdf but containing plain text (not starting with %PDF-)
        var fakeBytes = Encoding.UTF8.GetBytes("This is NOT a real PDF file header");
        var formFile = CreateMockPdfFile("homework.pdf", fakeBytes);

        var result = await controller.SubmitAssignment(assignment.Id, formFile);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Equal(400, badRequestResult.StatusCode);
    }

    [Fact]
    public async Task SubmitAssignment_ValidEnrolledStudentAndValidPdf_Succeeds()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var classEntity = new Class { Id = Guid.NewGuid(), Name = "Grade 10 - Biology", GradeLevel = "10" };
        var subject = new Subject { Id = Guid.NewGuid(), Name = "Biology", Code = "BIO101" };
        var student = new User { Id = Guid.NewGuid(), Name = "Charlie", Email = "charlie@student.com", PasswordHash = "hash", Role = UserRole.Student };
        var teacher = new User { Id = Guid.NewGuid(), Name = "Teacher Davis", Email = "davis@school.com", PasswordHash = "hash", Role = UserRole.Teacher };

        var assignment = new Assignment
        {
            Id = Guid.NewGuid(),
            Title = "Cell Biology Essay",
            Description = "Write 500 words",
            Deadline = DateTime.UtcNow.AddDays(5),
            MaxMarks = 100,
            ClassId = classEntity.Id,
            SubjectId = subject.Id,
            TeacherId = teacher.Id,
            Status = AssignmentStatus.Published
        };

        db.Classes.Add(classEntity);
        db.Subjects.Add(subject);
        db.Users.AddRange(student, teacher);
        db.Assignments.Add(assignment);
        db.ClassStudents.Add(new ClassStudent { ClassId = classEntity.Id, StudentId = student.Id });
        await db.SaveChangesAsync();

        mockStorage
            .Setup(s => s.UploadPdfAsync(It.IsAny<Stream>(), It.IsAny<string>(), It.IsAny<long>()))
            .ReturnsAsync(new StorageUploadResult(
                "submissions/mock-key.pdf",
                "http://localhost:5000/api/student/submissions/file?key=submissions/mock-key.pdf",
                "cell_essay.pdf",
                1024
            ));

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object)
        {
            ControllerContext = CreateUserContext(student.Id, "Student")
        };

        // Act
        var validPdfBytes = Encoding.UTF8.GetBytes("%PDF-1.7 Valid PDF Content");
        var formFile = CreateMockPdfFile("cell_essay.pdf", validPdfBytes);

        var result = await controller.SubmitAssignment(assignment.Id, formFile);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(200, okResult.StatusCode);

        var savedSub = await db.Submissions.FirstOrDefaultAsync(s => s.AssignmentId == assignment.Id && s.StudentId == student.Id);
        Assert.NotNull(savedSub);
        Assert.Equal(SubmissionStatus.Submitted, savedSub.Status);
    }

    [Fact]
    public async Task GlobalExceptionHandler_CatchesArgumentException_Returns400ProblemDetails()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<GlobalExceptionHandlerMiddleware>>();
        var envMock = new Mock<IHostEnvironment>();
        envMock.Setup(e => e.EnvironmentName).Returns("Development");

        RequestDelegate next = (HttpContext ctx) => throw new ArgumentException("Invalid field value provided.");

        var middleware = new GlobalExceptionHandlerMiddleware(next, loggerMock.Object, envMock.Object);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(400, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var json = JsonDocument.Parse(body);
        Assert.Equal(400, json.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Invalid Request", json.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task GlobalExceptionHandler_CatchesKeyNotFoundException_Returns404ProblemDetails()
    {
        // Arrange
        var loggerMock = new Mock<ILogger<GlobalExceptionHandlerMiddleware>>();
        var envMock = new Mock<IHostEnvironment>();
        envMock.Setup(e => e.EnvironmentName).Returns("Production");

        RequestDelegate next = (HttpContext ctx) => throw new KeyNotFoundException("Assignment ID not found.");

        var middleware = new GlobalExceptionHandlerMiddleware(next, loggerMock.Object, envMock.Object);

        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        Assert.Equal(404, context.Response.StatusCode);
        Assert.Equal("application/problem+json", context.Response.ContentType);

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body);
        var body = await reader.ReadToEndAsync();

        var json = JsonDocument.Parse(body);
        Assert.Equal(404, json.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Resource Not Found", json.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task AdminClassesController_CreateClass_TrimsInputDefensively()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var controller = new AdminClassesController(db);

        // Act
        var result = await controller.CreateClass(new CreateClassDto("  Class 9-A  ", "  Grade 9  "));

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result);
        var createdClass = Assert.IsType<Class>(createdResult.Value);
        Assert.Equal("Class 9-A", createdClass.Name);
        Assert.Equal("Grade 9", createdClass.GradeLevel);
    }
}
