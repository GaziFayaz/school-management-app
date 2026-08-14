using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.BuildingBlocks.Storage;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Submissions.Controllers;

[ApiController]
[Route("api/student/submissions")]
[Authorize]
public class StudentSubmissionsController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IStorageService _storageService;
    private readonly IWebHostEnvironment _env;

    public StudentSubmissionsController(AppDbContext db, IStorageService storageService, IWebHostEnvironment env)
    {
        _db = db;
        _storageService = storageService;
        _env = env;
    }

    private Guid GetUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet("my-assignments")]
    [Authorize(Roles = "Student")]
    public async Task<IActionResult> GetEnrolledAssignments()
    {
        var studentId = GetUserId();

        // Get student's enrolled classes
        var classIds = await _db.ClassStudents
            .Where(cs => cs.StudentId == studentId)
            .Select(cs => cs.ClassId)
            .ToListAsync();

        var assignments = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .Where(a => classIds.Contains(a.ClassId) && a.Status == AssignmentStatus.Published)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var existingSubmissions = await _db.Submissions
            .Where(s => s.StudentId == studentId)
            .ToDictionaryAsync(s => s.AssignmentId);

        var result = assignments.Select(a =>
        {
            var sub = existingSubmissions.TryGetValue(a.Id, out var existing) ? existing : null;
            return new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Deadline,
                a.MaxMarks,
                ClassName = a.Class.Name,
                SubjectName = a.Subject.Name,
                TeacherName = a.Teacher.Name,
                IsSubmitted = sub != null,
                SubmissionId = sub?.Id,
                SubmissionStatus = sub?.Status.ToString(),
                SubmittedAt = sub?.SubmittedAt,
                FileName = sub?.FileName,
                FileUrl = sub?.FileUrl,
                Marks = sub?.Marks,
                Feedback = sub?.Feedback
            };
        });

        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(10 * 1024 * 1024)] // 10MB limit
    public async Task<IActionResult> SubmitAssignment([FromForm] Guid assignmentId, IFormFile file)
    {
        var studentId = GetUserId();

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "PDF file is required." });
        }

        // Validate File Extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (extension != ".pdf")
        {
            return BadRequest(new { message = "Only PDF files (.pdf) are allowed for assignment submission." });
        }

        // Validate File Size (10MB)
        if (file.Length > 10 * 1024 * 1024)
        {
            return BadRequest(new { message = "File size exceeds the maximum limit of 10 MB." });
        }

        var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.Id == assignmentId && a.Status == AssignmentStatus.Published);
        if (assignment == null)
        {
            return NotFound(new { message = "Published assignment not found." });
        }

        // Validate Deadline
        if (DateTime.UtcNow > assignment.Deadline)
        {
            return BadRequest(new { message = "Submission deadline has passed. Late submissions are not allowed." });
        }

        // Check if existing submission exists
        var existingSubmission = await _db.Submissions.FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId);
        if (existingSubmission != null && existingSubmission.Status == SubmissionStatus.Graded)
        {
            return BadRequest(new { message = "Your submission has already been graded and cannot be updated." });
        }

        using var stream = file.OpenReadStream();
        var uploadResult = await _storageService.UploadPdfAsync(stream, file.FileName, file.Length);

        if (existingSubmission != null)
        {
            // Delete previous file from storage
            if (!string.IsNullOrEmpty(existingSubmission.FileKey))
            {
                await _storageService.DeleteFileAsync(existingSubmission.FileKey);
            }

            existingSubmission.FileUrl = uploadResult.FileUrl;
            existingSubmission.FileKey = uploadResult.FileKey;
            existingSubmission.FileName = uploadResult.FileName;
            existingSubmission.FileSize = uploadResult.FileSize;
            existingSubmission.SubmittedAt = DateTime.UtcNow;
            existingSubmission.Status = SubmissionStatus.Submitted;
            existingSubmission.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var submission = new Submission
            {
                AssignmentId = assignmentId,
                StudentId = studentId,
                FileUrl = uploadResult.FileUrl,
                FileKey = uploadResult.FileKey,
                FileName = uploadResult.FileName,
                FileSize = uploadResult.FileSize,
                SubmittedAt = DateTime.UtcNow,
                Status = SubmissionStatus.Submitted
            };
            _db.Submissions.Add(submission);
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Assignment submitted successfully." });
    }

    [HttpGet("file")]
    [AllowAnonymous] // Allows iframe PDF preview & browser downloads
    public async Task<IActionResult> ServeFile([FromQuery] string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return BadRequest(new { message = "File key is required." });
        }

        var fileResult = await _storageService.GetFileStreamAsync(key);
        if (fileResult == null)
        {
            return NotFound(new { message = "Requested PDF file not found on storage." });
        }

        return File(fileResult.Stream, fileResult.ContentType, enableRangeProcessing: true);
    }
}

