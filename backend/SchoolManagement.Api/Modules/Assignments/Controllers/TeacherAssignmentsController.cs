using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;

namespace SchoolManagement.Api.Modules.Assignments.Controllers;

public record CreateAssignmentDto(
    [Required(ErrorMessage = "Title is required."), StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters.")] string Title,
    [Required(ErrorMessage = "Description is required.")] string Description,
    [Required(ErrorMessage = "Deadline is required.")] DateTime Deadline,
    [Required(ErrorMessage = "Max marks is required."), Range(0.1, 10000, ErrorMessage = "Max marks must be greater than 0.")] decimal MaxMarks,
    [Required(ErrorMessage = "ClassId is required.")] Guid ClassId,
    [Required(ErrorMessage = "SubjectId is required.")] Guid SubjectId,
    [Required(ErrorMessage = "Status is required.")] AssignmentStatus Status
);

public record UpdateAssignmentDto(
    [Required(ErrorMessage = "Title is required."), StringLength(200, MinimumLength = 1, ErrorMessage = "Title must be between 1 and 200 characters.")] string Title,
    [Required(ErrorMessage = "Description is required.")] string Description,
    [Required(ErrorMessage = "Deadline is required.")] DateTime Deadline,
    [Required(ErrorMessage = "Max marks is required."), Range(0.1, 10000, ErrorMessage = "Max marks must be greater than 0.")] decimal MaxMarks,
    [Required(ErrorMessage = "Status is required.")] AssignmentStatus Status
);

[ApiController]
[Route("api/teacher/assignments")]
[Authorize(Roles = "Teacher")]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeacherAssignmentsController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetTeacherId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(idClaim) || !Guid.TryParse(idClaim, out var teacherId))
        {
            throw new UnauthorizedAccessException("Invalid or missing user identification in authentication token.");
        }
        return teacherId;
    }

    [HttpGet]
    public async Task<IActionResult> GetTeacherAssignments()
    {
        var teacherId = GetTeacherId();
        var assignments = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Where(a => a.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Deadline,
                a.MaxMarks,
                a.ClassId,
                ClassName = a.Class.Name,
                a.SubjectId,
                SubjectName = a.Subject.Name,
                Status = a.Status.ToString(),
                SubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id),
                GradedSubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id && s.Status == Submissions.Models.SubmissionStatus.Graded),
                EnrolledStudentsCount = _db.ClassStudents.Count(cs => cs.ClassId == a.ClassId),
                a.CreatedAt,
                a.UpdatedAt
            })
            .ToListAsync();

        return Ok(assignments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssignmentDetail(Guid id)
    {
        var teacherId = GetTeacherId();
        var assignment = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Where(a => a.Id == id && a.TeacherId == teacherId)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Deadline,
                a.MaxMarks,
                a.ClassId,
                ClassName = a.Class.Name,
                ClassGradeLevel = a.Class.GradeLevel,
                a.SubjectId,
                SubjectName = a.Subject.Name,
                SubjectCode = a.Subject.Code,
                Status = a.Status.ToString(),
                SubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id),
                GradedSubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id && s.Status == Submissions.Models.SubmissionStatus.Graded),
                PendingGradingCount = _db.Submissions.Count(s => s.AssignmentId == a.Id && s.Status == Submissions.Models.SubmissionStatus.Submitted),
                EnrolledStudentsCount = _db.ClassStudents.Count(cs => cs.ClassId == a.ClassId),
                AverageMarks = _db.Submissions
                    .Where(s => s.AssignmentId == a.Id && s.Status == Submissions.Models.SubmissionStatus.Graded && s.Marks.HasValue)
                    .Select(s => s.Marks)
                    .Average(),
                a.CreatedAt,
                a.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (assignment == null)
        {
            return NotFound(new { message = "Assignment not found or unauthorized." });
        }

        return Ok(assignment);
    }

    [HttpGet("my-allocations")]
    public async Task<IActionResult> GetMyAllocations()
    {
        var teacherId = GetTeacherId();
        var allocations = await _db.ClassSubjectTeachers
            .Include(c => c.Class)
            .Include(c => c.Subject)
            .Where(c => c.TeacherId == teacherId)
            .Select(c => new
            {
                c.ClassId,
                ClassName = c.Class.Name,
                c.SubjectId,
                SubjectName = c.Subject.Name
            })
            .ToListAsync();

        return Ok(allocations);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto)
    {
        var teacherId = GetTeacherId();

        // Verify teacher is assigned to this Class and Subject
        var isAllocated = await _db.ClassSubjectTeachers.AnyAsync(c => c.TeacherId == teacherId && c.ClassId == dto.ClassId && c.SubjectId == dto.SubjectId);
        if (!isAllocated)
        {
            return StatusCode(403, new { message = "You are not assigned to teach this class and subject." });
        }

        if (dto.MaxMarks <= 0)
        {
            return BadRequest(new { message = "Maximum marks must be greater than 0." });
        }

        var assignment = new Assignment
        {
            Title = dto.Title,
            Description = dto.Description,
            Deadline = DateTime.SpecifyKind(dto.Deadline, DateTimeKind.Utc),
            MaxMarks = dto.MaxMarks,
            ClassId = dto.ClassId,
            SubjectId = dto.SubjectId,
            TeacherId = teacherId,
            Status = dto.Status
        };

        _db.Assignments.Add(assignment);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTeacherAssignments), new { id = assignment.Id }, assignment);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAssignmentDto dto)
    {
        var teacherId = GetTeacherId();
        var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == teacherId);
        if (assignment == null) return NotFound(new { message = "Assignment not found or unauthorized." });

        if (dto.MaxMarks <= 0) return BadRequest(new { message = "Maximum marks must be greater than 0." });

        assignment.Title = dto.Title;
        assignment.Description = dto.Description;
        assignment.Deadline = DateTime.SpecifyKind(dto.Deadline, DateTimeKind.Utc);
        assignment.MaxMarks = dto.MaxMarks;
        assignment.Status = dto.Status;
        assignment.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(assignment);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(Guid id, [FromQuery] AssignmentStatus status)
    {
        var teacherId = GetTeacherId();
        var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == teacherId);
        if (assignment == null) return NotFound();

        assignment.Status = status;
        assignment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { id = assignment.Id, status = assignment.Status.ToString() });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAssignment(Guid id)
    {
        var teacherId = GetTeacherId();
        var assignment = await _db.Assignments.FirstOrDefaultAsync(a => a.Id == id && a.TeacherId == teacherId);
        if (assignment == null) return NotFound();

        assignment.IsDeleted = true;
        assignment.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
