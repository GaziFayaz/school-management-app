using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Overview.Controllers;

[ApiController]
[Route("api/student/overview")]
[Authorize(Roles = "Student")]
public class StudentOverviewController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentOverviewController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetStudentId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStudentOverviewStats()
    {
        var studentId = GetStudentId();

        var enrolledClassIds = await _db.ClassStudents
            .Where(cs => cs.StudentId == studentId)
            .Select(cs => cs.ClassId)
            .Distinct()
            .ToListAsync();

        var enrolledClassesCount = enrolledClassIds.Count;

        var enrolledSubjectsCount = await _db.ClassSubjectTeachers
            .Where(cst => enrolledClassIds.Contains(cst.ClassId))
            .Select(cst => cst.SubjectId)
            .Distinct()
            .CountAsync();

        var allPublishedAssignments = await _db.Assignments
            .Include(a => a.Class)
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .Where(a => enrolledClassIds.Contains(a.ClassId) && a.Status == AssignmentStatus.Published)
            .OrderBy(a => a.Deadline)
            .ToListAsync();

        var studentSubmissions = await _db.Submissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Class)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Subject)
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Teacher)
            .Where(s => s.StudentId == studentId)
            .ToListAsync();

        var submissionDict = studentSubmissions.ToDictionary(s => s.AssignmentId);

        var totalAssignmentsCount = allPublishedAssignments.Count;
        var submittedCount = studentSubmissions.Count;
        var pendingAssignmentsCount = allPublishedAssignments.Count(a => !submissionDict.ContainsKey(a.Id) && a.Deadline >= DateTime.UtcNow);
        var overdueCount = allPublishedAssignments.Count(a => !submissionDict.ContainsKey(a.Id) && a.Deadline < DateTime.UtcNow);
        var gradedSubmissionsCount = studentSubmissions.Count(s => s.Status == SubmissionStatus.Graded);

        // Average percentage across graded assignments
        var gradedWithMarks = studentSubmissions
            .Where(s => s.Status == SubmissionStatus.Graded && s.Marks.HasValue && s.Assignment.MaxMarks > 0)
            .ToList();

        double? averagePercentage = gradedWithMarks.Count > 0
            ? Math.Round(gradedWithMarks.Average(s => (double)(s.Marks!.Value / s.Assignment.MaxMarks) * 100), 1)
            : null;

        decimal? averageMarks = gradedWithMarks.Count > 0
            ? Math.Round(gradedWithMarks.Average(s => s.Marks!.Value), 1)
            : null;

        var upcomingDeadlines = allPublishedAssignments
            .Where(a => a.Deadline >= DateTime.UtcNow)
            .Take(6)
            .Select(a =>
            {
                var isSub = submissionDict.TryGetValue(a.Id, out var sub);
                return new
                {
                    a.Id,
                    a.Title,
                    a.Deadline,
                    a.MaxMarks,
                    ClassName = a.Class.Name,
                    SubjectName = a.Subject.Name,
                    TeacherName = a.Teacher.Name,
                    IsSubmitted = isSub,
                    SubmissionStatus = sub?.Status.ToString(),
                    Marks = sub?.Marks
                };
            })
            .ToList();

        var recentGradedSubmissions = studentSubmissions
            .Where(s => s.Status == SubmissionStatus.Graded)
            .OrderByDescending(s => s.UpdatedAt)
            .Take(6)
            .Select(s => new
            {
                s.Id,
                s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                AssignmentMaxMarks = s.Assignment.MaxMarks,
                ClassName = s.Assignment.Class.Name,
                SubjectName = s.Assignment.Subject.Name,
                TeacherName = s.Assignment.Teacher.Name,
                s.FileName,
                s.FileUrl,
                s.SubmittedAt,
                Status = s.Status.ToString(),
                s.Marks,
                Percentage = s.Marks.HasValue && s.Assignment.MaxMarks > 0
                    ? Math.Round((double)(s.Marks.Value / s.Assignment.MaxMarks) * 100, 1)
                    : (double?)null,
                s.Feedback
            })
            .ToList();

        return Ok(new
        {
            enrolledClassesCount,
            enrolledSubjectsCount,
            totalAssignmentsCount,
            submittedCount,
            pendingAssignmentsCount,
            overdueCount,
            gradedSubmissionsCount,
            averagePercentage,
            averageMarks,
            upcomingDeadlines,
            recentGradedSubmissions
        });
    }
}
