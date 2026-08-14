using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;

namespace SchoolManagement.Api.Modules.Assignments.Controllers;

public record CreateAssignmentDto(string Title, string Description, DateTime Deadline, decimal MaxMarks, Guid ClassId, Guid SubjectId, AssignmentStatus Status);
public record UpdateAssignmentDto(string Title, string Description, DateTime Deadline, decimal MaxMarks, AssignmentStatus Status);

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
        return Guid.Parse(idClaim!);
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

        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
