using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Overview.Controllers;

[ApiController]
[Route("api/teacher/overview")]
[Authorize(Roles = "Teacher")]
public class TeacherOverviewController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeacherOverviewController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetTeacherId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetTeacherOverviewStats()
    {
        var teacherId = GetTeacherId();

        var teacherClassIds = await _db.ClassSubjectTeachers
            .Where(cst => cst.TeacherId == teacherId)
            .Select(cst => cst.ClassId)
            .Distinct()
            .ToListAsync();

        var totalAssignedClasses = teacherClassIds.Count;

        var totalAllocations = await _db.ClassSubjectTeachers
            .CountAsync(cst => cst.TeacherId == teacherId);

        var totalStudentsTaught = await _db.ClassStudents
            .Where(cs => teacherClassIds.Contains(cs.ClassId))
            .Select(cs => cs.StudentId)
            .Distinct()
            .CountAsync();

        var totalAssignments = await _db.Assignments
            .CountAsync(a => a.TeacherId == teacherId);

        var publishedAssignments = await _db.Assignments
            .CountAsync(a => a.TeacherId == teacherId && a.Status == AssignmentStatus.Published);

        var draftAssignments = await _db.Assignments
            .CountAsync(a => a.TeacherId == teacherId && a.Status == AssignmentStatus.Draft);

        var activeAssignments = await _db.Assignments
            .CountAsync(a => a.TeacherId == teacherId && a.Status == AssignmentStatus.Published && a.Deadline >= DateTime.UtcNow);

        var totalSubmissions = await _db.Submissions
            .CountAsync(s => s.Assignment.TeacherId == teacherId);

        var gradedSubmissions = await _db.Submissions
            .CountAsync(s => s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded);

        var pendingSubmissions = await _db.Submissions
            .CountAsync(s => s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Submitted);

        double gradingRate = totalSubmissions > 0
            ? Math.Round(((double)gradedSubmissions / totalSubmissions) * 100, 1)
            : 0;

        decimal? averageMarks = gradedSubmissions > 0
            ? Math.Round(await _db.Submissions.Where(s => s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded && s.Marks.HasValue).AverageAsync(s => s.Marks!.Value), 1)
            : null;

        var recentSubmissions = await _db.Submissions
            .Include(s => s.Student)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Class)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Subject)
            .Where(s => s.Assignment.TeacherId == teacherId)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(6)
            .Select(s => new
            {
                s.Id,
                s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                AssignmentMaxMarks = s.Assignment.MaxMarks,
                ClassName = s.Assignment.Class.Name,
                SubjectName = s.Assignment.Subject.Name,
                s.StudentId,
                StudentName = s.Student.Name,
                StudentEmail = s.Student.Email,
                s.FileName,
                s.FileUrl,
                s.SubmittedAt,
                Status = s.Status.ToString(),
                s.Marks,
                s.Feedback
            })
            .ToListAsync();

        return Ok(new
        {
            classesCount = totalAssignedClasses,
            allocationsCount = totalAllocations,
            studentsCount = totalStudentsTaught,
            assignmentsCount = totalAssignments,
            publishedAssignmentsCount = publishedAssignments,
            draftAssignmentsCount = draftAssignments,
            activeAssignmentsCount = activeAssignments,
            totalSubmissionsCount = totalSubmissions,
            gradedSubmissionsCount = gradedSubmissions,
            pendingSubmissionsCount = pendingSubmissions,
            gradingRate,
            averageMarks,
            recentSubmissions
        });
    }
}
