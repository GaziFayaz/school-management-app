using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Classes.Controllers;

[ApiController]
[Route("api/student/classes")]
[Authorize(Roles = "Student")]
public class StudentClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public StudentClassesController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetStudentId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetEnrolledClasses()
    {
        var studentId = GetStudentId();

        var enrolledClasses = await _db.ClassStudents
            .Include(cs => cs.Class)
            .Where(cs => cs.StudentId == studentId)
            .OrderBy(cs => cs.Class.GradeLevel)
            .ThenBy(cs => cs.Class.Name)
            .ToListAsync();

        var classIds = enrolledClasses.Select(cs => cs.ClassId).ToList();

        var classAllocations = await _db.ClassSubjectTeachers
            .Include(cst => cst.Subject)
            .Include(cst => cst.Teacher)
            .Where(cst => classIds.Contains(cst.ClassId))
            .ToListAsync();

        var publishedAssignments = await _db.Assignments
            .Where(a => classIds.Contains(a.ClassId) && a.Status == AssignmentStatus.Published)
            .ToListAsync();

        var studentSubmissions = await _db.Submissions
            .Where(s => s.StudentId == studentId)
            .ToListAsync();

        var submissionDict = studentSubmissions.ToDictionary(s => s.AssignmentId);

        var result = enrolledClasses.Select(cs =>
        {
            var cls = cs.Class;
            var subjects = classAllocations
                .Where(a => a.ClassId == cls.Id)
                .Select(a => new
                {
                    a.SubjectId,
                    SubjectName = a.Subject.Name,
                    SubjectCode = a.Subject.Code,
                    TeacherId = a.Teacher.Id,
                    TeacherName = a.Teacher.Name,
                    TeacherEmail = a.Teacher.Email
                })
                .ToList();

            var classAssignments = publishedAssignments.Where(a => a.ClassId == cls.Id).ToList();
            var completedCount = classAssignments.Count(a => submissionDict.ContainsKey(a.Id));
            var pendingCount = classAssignments.Count(a => !submissionDict.ContainsKey(a.Id) && a.Deadline >= DateTime.UtcNow);

            return new
            {
                ClassId = cls.Id,
                ClassName = cls.Name,
                GradeLevel = cls.GradeLevel,
                CreatedAt = cls.CreatedAt,
                Subjects = subjects,
                TotalAssignmentsCount = classAssignments.Count,
                CompletedAssignmentsCount = completedCount,
                PendingAssignmentsCount = pendingCount
            };
        });

        return Ok(result);
    }

    [HttpGet("{classId}")]
    public async Task<IActionResult> GetClassDetails(Guid classId)
    {
        var studentId = GetStudentId();

        var enrollment = await _db.ClassStudents
            .Include(cs => cs.Class)
            .FirstOrDefaultAsync(cs => cs.ClassId == classId && cs.StudentId == studentId);

        if (enrollment == null)
        {
            return NotFound(new { message = "Class not found or you are not enrolled in this class." });
        }

        var cls = enrollment.Class;

        var allocations = await _db.ClassSubjectTeachers
            .Include(cst => cst.Subject)
            .Include(cst => cst.Teacher)
            .Where(cst => cst.ClassId == classId)
            .ToListAsync();

        var subjects = allocations
            .GroupBy(a => new { a.SubjectId, a.Subject.Name, a.Subject.Code })
            .Select(g => new
            {
                SubjectId = g.Key.SubjectId,
                SubjectName = g.Key.Name,
                SubjectCode = g.Key.Code,
                Teachers = g.Select(t => new
                {
                    TeacherId = t.Teacher.Id,
                    TeacherName = t.Teacher.Name,
                    TeacherEmail = t.Teacher.Email
                }).ToList()
            })
            .ToList();

        var assignments = await _db.Assignments
            .Include(a => a.Subject)
            .Include(a => a.Teacher)
            .Where(a => a.ClassId == classId && a.Status == AssignmentStatus.Published)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var assignmentIds = assignments.Select(a => a.Id).ToList();

        var submissions = await _db.Submissions
            .Where(s => assignmentIds.Contains(s.AssignmentId) && s.StudentId == studentId)
            .ToDictionaryAsync(s => s.AssignmentId);

        var assignmentList = assignments.Select(a =>
        {
            var isSub = submissions.TryGetValue(a.Id, out var sub);
            return new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Deadline,
                a.MaxMarks,
                a.SubjectId,
                SubjectName = a.Subject.Name,
                SubjectCode = a.Subject.Code,
                TeacherId = a.Teacher.Id,
                TeacherName = a.Teacher.Name,
                TeacherEmail = a.Teacher.Email,
                IsSubmitted = isSub,
                SubmissionId = sub?.Id,
                SubmissionStatus = sub?.Status.ToString(),
                SubmittedAt = sub?.SubmittedAt,
                FileName = sub?.FileName,
                FileUrl = sub?.FileUrl,
                Marks = sub?.Marks,
                Feedback = sub?.Feedback,
                a.CreatedAt
            };
        }).ToList();

        return Ok(new
        {
            ClassId = cls.Id,
            ClassName = cls.Name,
            GradeLevel = cls.GradeLevel,
            CreatedAt = cls.CreatedAt,
            Subjects = subjects,
            Assignments = assignmentList
        });
    }
}
