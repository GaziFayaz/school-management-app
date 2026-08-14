using System.IO;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SchoolManagement.Api.BuildingBlocks.Storage;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Controllers;
using SchoolManagement.Api.Modules.Submissions.Models;
using Xunit;

namespace SchoolManagement.Tests.Submissions;

public class SubmissionWorkflowTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task SubmitAssignment_NonPdfFile_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object);
        var studentId = Guid.NewGuid();

        controller.ControllerContext = new ControllerContext
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

        var fileMock = new Mock<IFormFile>();
        var content = "Hello World";
        var fileName = "answer.txt";
        var ms = new MemoryStream();
        var writer = new StreamWriter(ms);
        writer.Write(content);
        writer.Flush();
        ms.Position = 0;

        fileMock.Setup(_ => _.OpenReadStream()).Returns(ms);
        fileMock.Setup(_ => _.FileName).Returns(fileName);
        fileMock.Setup(_ => _.Length).Returns(ms.Length);

        // Act
        var result = await controller.SubmitAssignment(Guid.NewGuid(), fileMock.Object);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Only PDF files", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task SubmitAssignment_FileExceeds10MB_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();

        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object);
        var studentId = Guid.NewGuid();

        controller.ControllerContext = new ControllerContext
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

        var fileMock = new Mock<IFormFile>();
        fileMock.Setup(_ => _.FileName).Returns("large.pdf");
        fileMock.Setup(_ => _.Length).Returns(11 * 1024 * 1024); // 11MB

        // Act
        var result = await controller.SubmitAssignment(Guid.NewGuid(), fileMock.Object);

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("exceeds the maximum limit", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task GradeSubmission_MarksExceedMaxMarks_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var assignment = new Assignment
        {
            Title = "Math Test",
            Description = "Test",
            Deadline = DateTime.UtcNow.AddDays(1),
            MaxMarks = 50,
            ClassId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            TeacherId = teacherId,
            Status = AssignmentStatus.Published
        };
        db.Assignments.Add(assignment);

        var submission = new Submission
        {
            AssignmentId = assignment.Id,
            StudentId = studentId,
            FileUrl = "http://example.com/test.pdf",
            FileKey = "test.pdf",
            FileName = "test.pdf",
            FileSize = 1000,
            Status = SubmissionStatus.Submitted
        };
        db.Submissions.Add(submission);
        await db.SaveChangesAsync();

        var controller = new TeacherGradingController(db);
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

        // Act
        var result = await controller.GradeSubmission(submission.Id, new GradeSubmissionDto(60, "Great effort!"));

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("Marks must be between 0 and maximum marks", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task ServeFile_EmptyKey_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var mockEnv = new Mock<IWebHostEnvironment>();
        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object);

        // Act
        var result = await controller.ServeFile("");

        // Assert
        var badRequest = Assert.IsType<BadRequestObjectResult>(result);
        Assert.Contains("File key is required", badRequest.Value?.ToString());
    }

    [Fact]
    public async Task ServeFile_FileNotFound_ReturnsNotFound()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        mockStorage.Setup(s => s.GetFileStreamAsync("missing-key.pdf"))
            .ReturnsAsync((StorageFileResult?)null);
        var mockEnv = new Mock<IWebHostEnvironment>();
        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object);

        // Act
        var result = await controller.ServeFile("missing-key.pdf");

        // Assert
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Contains("Requested PDF file not found", notFound.Value?.ToString());
    }

    [Fact]
    public async Task ServeFile_FileExists_ReturnsFileStreamResult()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockStorage = new Mock<IStorageService>();
        var sampleBytes = new byte[] { 0x25, 0x50, 0x44, 0x46 }; // %PDF
        var ms = new MemoryStream(sampleBytes);
        mockStorage.Setup(s => s.GetFileStreamAsync("valid-key.pdf"))
            .ReturnsAsync(new StorageFileResult(ms, "application/pdf"));
        var mockEnv = new Mock<IWebHostEnvironment>();
        var controller = new StudentSubmissionsController(db, mockStorage.Object, mockEnv.Object);

        // Act
        var result = await controller.ServeFile("valid-key.pdf");

        // Assert
        var fileResult = Assert.IsType<FileStreamResult>(result);
        Assert.Equal("application/pdf", fileResult.ContentType);
        Assert.True(fileResult.EnableRangeProcessing);
    }
}

