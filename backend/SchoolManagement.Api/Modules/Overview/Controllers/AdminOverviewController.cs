using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Overview.Controllers;

[ApiController]
[Route("api/admin/overview")]
[Authorize(Roles = "Admin")]
public class AdminOverviewController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminOverviewController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetOverviewStats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var adminCount = await _db.Users.CountAsync(u => u.Role == UserRole.Admin);
        var teacherCount = await _db.Users.CountAsync(u => u.Role == UserRole.Teacher);
        var studentCount = await _db.Users.CountAsync(u => u.Role == UserRole.Student);

        var totalClasses = await _db.Classes.CountAsync();
        var totalSubjects = await _db.Subjects.CountAsync();
        var totalAllocations = await _db.ClassSubjectTeachers.CountAsync();

        var totalAssignments = await _db.Assignments.CountAsync();
        var draftAssignments = await _db.Assignments.CountAsync(a => a.Status == AssignmentStatus.Draft);
        var publishedAssignments = await _db.Assignments.CountAsync(a => a.Status == AssignmentStatus.Published);

        var totalSubmissions = await _db.Submissions.CountAsync();
        var gradedSubmissions = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Graded);
        var pendingSubmissions = await _db.Submissions.CountAsync(s => s.Status == SubmissionStatus.Submitted);

        double gradingRate = totalSubmissions > 0
            ? Math.Round(((double)gradedSubmissions / totalSubmissions) * 100, 1)
            : 0;

        decimal? averageMarks = gradedSubmissions > 0
            ? Math.Round(await _db.Submissions.Where(s => s.Status == SubmissionStatus.Graded && s.Marks.HasValue).AverageAsync(s => s.Marks!.Value), 1)
            : null;

        return Ok(new
        {
            users = new
            {
                totalUsers,
                adminCount,
                teacherCount,
                studentCount
            },
            academics = new
            {
                totalClasses,
                totalSubjects,
                totalAllocations
            },
            assignments = new
            {
                totalAssignments,
                draftAssignments,
                publishedAssignments
            },
            submissions = new
            {
                totalSubmissions,
                gradedSubmissions,
                pendingSubmissions,
                gradingRate,
                averageMarks
            }
        });
    }
}
