using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;

namespace SchoolManagement.Api.Modules.Assignments.Controllers;

[ApiController]
[Route("api/admin/assignments")]
[Authorize(Roles = "Admin")]
public class AdminAssignmentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminAssignmentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAssignments(
        [FromQuery] Guid? classId,
        [FromQuery] Guid? subjectId,
        [FromQuery] Guid? teacherId,
        [FromQuery] Guid? studentId,
        [FromQuery] string? status)
    {
        var query = _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .AsQueryable();

        if (classId.HasValue)
        {
            query = query.Where(a => a.ClassId == classId.Value);
        }

        if (subjectId.HasValue)
        {
            query = query.Where(a => a.SubjectId == subjectId.Value);
        }

        if (teacherId.HasValue)
        {
            query = query.Where(a => a.TeacherId == teacherId.Value);
        }

        if (studentId.HasValue)
        {
            var studentClassIds = await _db.ClassStudents
                .Where(cs => cs.StudentId == studentId.Value)
                .Select(cs => cs.ClassId)
                .ToListAsync();

            query = query.Where(a => studentClassIds.Contains(a.ClassId));
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<AssignmentStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(a => a.Status == parsedStatus);
        }

        var assignments = await query
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
                a.TeacherId,
                TeacherName = a.Teacher.Name,
                TeacherEmail = a.Teacher.Email,
                Status = a.Status.ToString(),
                SubmissionCount = _db.Submissions.Count(s => s.AssignmentId == a.Id),
                GradedCount = _db.Submissions.Count(s => s.AssignmentId == a.Id && s.Status == Submissions.Models.SubmissionStatus.Graded),
                a.CreatedAt
            })
            .ToListAsync();

        return Ok(assignments);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAssignmentDetail(Guid id)
    {
        var assignment = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        var submissionCount = await _db.Submissions.CountAsync(s => s.AssignmentId == id);
        var gradedCount = await _db.Submissions.CountAsync(s => s.AssignmentId == id && s.Status == Submissions.Models.SubmissionStatus.Graded);

        return Ok(new
        {
            assignment.Id,
            assignment.Title,
            assignment.Description,
            assignment.Deadline,
            assignment.MaxMarks,
            assignment.ClassId,
            ClassName = assignment.Class.Name,
            GradeLevel = assignment.Class.GradeLevel,
            assignment.SubjectId,
            SubjectName = assignment.Subject.Name,
            SubjectCode = assignment.Subject.Code,
            assignment.TeacherId,
            TeacherName = assignment.Teacher.Name,
            TeacherEmail = assignment.Teacher.Email,
            Status = assignment.Status.ToString(),
            submissionCount,
            gradedCount,
            assignment.CreatedAt,
            assignment.UpdatedAt
        });
    }

    [HttpGet("{id}/submissions")]
    public async Task<IActionResult> GetAssignmentSubmissions(Guid id)
    {
        var exists = await _db.Assignments.AnyAsync(a => a.Id == id);
        if (!exists) return NotFound(new { message = "Assignment not found." });

        var submissions = await _db.Submissions
            .Include(s => s.Student)
            .Where(s => s.AssignmentId == id)
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
                s.UpdatedAt
            })
            .ToListAsync();

        return Ok(submissions);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAssignment(Guid id)
    {
        var assignment = await _db.Assignments.FindAsync(id);
        if (assignment == null) return NotFound(new { message = "Assignment not found." });

        _db.Assignments.Remove(assignment);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
