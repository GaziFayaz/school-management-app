using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Submissions.Controllers;

public record GradeSubmissionDto(decimal Marks, string Feedback);

[ApiController]
[Route("api/teacher/submissions")]
[Authorize(Roles = "Teacher")]
public class TeacherGradingController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeacherGradingController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetTeacherId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet("assignment/{assignmentId}")]
    public async Task<IActionResult> GetAssignmentSubmissions(Guid assignmentId)
    {
        var teacherId = GetTeacherId();

        var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.Id == assignmentId && a.TeacherId == teacherId);
        if (assignment == null)
        {
            return NotFound(new { message = "Assignment not found or unauthorized." });
        }

        var submissions = await _db.Submissions
            .Include(s => s.Student)
            .Where(s => s.AssignmentId == assignmentId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new
            {
                s.Id,
                s.AssignmentId,
                s.StudentId,
                StudentName = s.Student.Name,
                StudentEmail = s.Student.Email,
                s.FileUrl,
                s.FileKey,
                s.FileName,
                s.FileSize,
                s.SubmittedAt,
                Status = s.Status.ToString(),
                s.Marks,
                s.Feedback,
                AssignmentMaxMarks = assignment.MaxMarks
            })
            .ToListAsync();

        return Ok(submissions);
    }

    [HttpGet("{submissionId}")]
    public async Task<IActionResult> GetSubmissionDetail(Guid submissionId)
    {
        var teacherId = GetTeacherId();

        var submission = await _db.Submissions
            .Include(s => s.Student)
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.Assignment.TeacherId == teacherId);

        if (submission == null)
        {
            return NotFound(new { message = "Submission not found or unauthorized." });
        }

        return Ok(new
        {
            submission.Id,
            submission.AssignmentId,
            AssignmentTitle = submission.Assignment.Title,
            AssignmentMaxMarks = submission.Assignment.MaxMarks,
            submission.StudentId,
            StudentName = submission.Student.Name,
            StudentEmail = submission.Student.Email,
            submission.FileUrl,
            submission.FileKey,
            submission.FileName,
            submission.FileSize,
            submission.SubmittedAt,
            Status = submission.Status.ToString(),
            submission.Marks,
            submission.Feedback,
            submission.UpdatedAt
        });
    }

    [HttpPost("{submissionId}/grade")]
    public async Task<IActionResult> GradeSubmission(Guid submissionId, [FromBody] GradeSubmissionDto dto)
    {
        var teacherId = GetTeacherId();

        var submission = await _db.Submissions
            .Include(s => s.Assignment)
            .FirstOrDefaultAsync(s => s.Id == submissionId && s.Assignment.TeacherId == teacherId);

        if (submission == null)
        {
            return NotFound(new { message = "Submission not found or unauthorized." });
        }

        if (dto.Marks < 0 || dto.Marks > submission.Assignment.MaxMarks)
        {
            return BadRequest(new { message = $"Marks must be between 0 and maximum marks ({submission.Assignment.MaxMarks})." });
        }

        submission.Marks = dto.Marks;
        submission.Feedback = dto.Feedback;
        submission.Status = SubmissionStatus.Graded;
        submission.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Submission graded successfully.", submissionId = submission.Id, marks = submission.Marks, status = submission.Status.ToString() });
    }
}
