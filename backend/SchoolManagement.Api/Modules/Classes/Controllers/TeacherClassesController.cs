using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Submissions.Models;

namespace SchoolManagement.Api.Modules.Classes.Controllers;

[ApiController]
[Route("api/teacher/classes")]
[Authorize(Roles = "Teacher")]
public class TeacherClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public TeacherClassesController(AppDbContext db)
    {
        _db = db;
    }

    private Guid GetTeacherId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.Parse(idClaim!);
    }

    [HttpGet]
    public async Task<IActionResult> GetTeacherClasses()
    {
        var teacherId = GetTeacherId();

        var allocations = await _db.ClassSubjectTeachers
            .Include(cst => cst.Class)
            .Include(cst => cst.Subject)
            .Where(cst => cst.TeacherId == teacherId)
            .Select(cst => new
            {
                AllocationId = cst.Id,
                cst.ClassId,
                ClassName = cst.Class.Name,
                ClassGradeLevel = cst.Class.GradeLevel,
                cst.SubjectId,
                SubjectName = cst.Subject.Name,
                SubjectCode = cst.Subject.Code,
                EnrolledStudentsCount = _db.ClassStudents.Count(cs => cs.ClassId == cst.ClassId),
                AssignmentsCount = _db.Assignments.Count(a => a.ClassId == cst.ClassId && a.SubjectId == cst.SubjectId && a.TeacherId == teacherId),
                ActiveAssignmentsCount = _db.Assignments.Count(a => a.ClassId == cst.ClassId && a.SubjectId == cst.SubjectId && a.TeacherId == teacherId && a.Status == AssignmentStatus.Published && a.Deadline >= DateTime.UtcNow)
            })
            .ToListAsync();

        return Ok(allocations);
    }

    [HttpGet("{classId}")]
    public async Task<IActionResult> GetClassDetail(Guid classId)
    {
        var teacherId = GetTeacherId();

        var isAllocated = await _db.ClassSubjectTeachers.AnyAsync(cst => cst.ClassId == classId && cst.TeacherId == teacherId);
        if (!isAllocated)
        {
            return NotFound(new { message = "Class not found or unauthorized." });
        }

        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == classId);
        if (cls == null) return NotFound(new { message = "Class not found." });

        var subjectsTaught = await _db.ClassSubjectTeachers
            .Include(cst => cst.Subject)
            .Where(cst => cst.ClassId == classId && cst.TeacherId == teacherId)
            .Select(cst => new
            {
                cst.SubjectId,
                SubjectName = cst.Subject.Name,
                SubjectCode = cst.Subject.Code
            })
            .ToListAsync();

        var students = await _db.ClassStudents
            .Include(cs => cs.Student)
            .Where(cs => cs.ClassId == classId)
            .OrderBy(cs => cs.Student.Name)
            .Select(cs => new
            {
                cs.StudentId,
                StudentName = cs.Student.Name,
                StudentEmail = cs.Student.Email,
                JoinedDate = cs.Student.CreatedAt,
                TotalSubmissions = _db.Submissions.Count(s => s.StudentId == cs.StudentId && s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId),
                GradedSubmissions = _db.Submissions.Count(s => s.StudentId == cs.StudentId && s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded),
                AverageMarks = _db.Submissions
                    .Where(s => s.StudentId == cs.StudentId && s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded && s.Marks.HasValue)
                    .Select(s => s.Marks)
                    .Average()
            })
            .ToListAsync();

        var assignments = await _db.Assignments
            .Include(a => a.Subject)
            .Where(a => a.ClassId == classId && a.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new
            {
                a.Id,
                a.Title,
                a.Description,
                a.Deadline,
                a.MaxMarks,
                a.SubjectId,
                SubjectName = a.Subject.Name,
                Status = a.Status.ToString(),
                SubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id),
                GradedSubmissionsCount = _db.Submissions.Count(s => s.AssignmentId == a.Id && s.Status == SubmissionStatus.Graded),
                a.CreatedAt
            })
            .ToListAsync();

        var totalSubmissionsCount = await _db.Submissions.CountAsync(s => s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId);
        var totalGradedCount = await _db.Submissions.CountAsync(s => s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded);
        var gradedScores = await _db.Submissions
            .Where(s => s.Assignment.ClassId == classId && s.Assignment.TeacherId == teacherId && s.Status == SubmissionStatus.Graded && s.Marks.HasValue)
            .Select(s => s.Marks)
            .ToListAsync();
        var averageClassScore = gradedScores.Count > 0 ? gradedScores.Average() : (decimal?)null;

        return Ok(new
        {
            cls.Id,
            cls.Name,
            cls.GradeLevel,
            Subjects = subjectsTaught,
            EnrolledStudentsCount = students.Count,
            AssignmentsCount = assignments.Count,
            TotalSubmissionsCount = totalSubmissionsCount,
            TotalGradedCount = totalGradedCount,
            AverageScore = averageClassScore,
            Students = students,
            Assignments = assignments
        });
    }

    [HttpGet("{classId}/students/{studentId}")]
    public async Task<IActionResult> GetStudentClassHistory(Guid classId, Guid studentId)
    {
        var teacherId = GetTeacherId();

        var isAllocated = await _db.ClassSubjectTeachers.AnyAsync(cst => cst.ClassId == classId && cst.TeacherId == teacherId);
        if (!isAllocated) return StatusCode(403, new { message = "Unauthorized access to class." });

        var student = await _db.Users.FirstOrDefaultAsync(u => u.Id == studentId);
        if (student == null) return NotFound(new { message = "Student not found." });

        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == classId);
        if (cls == null) return NotFound(new { message = "Class not found." });

        var classAssignments = await _db.Assignments
            .Include(a => a.Subject)
            .Where(a => a.ClassId == classId && a.TeacherId == teacherId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        var assignmentIds = classAssignments.Select(a => a.Id).ToList();

        var submissions = await _db.Submissions
            .Include(s => s.Assignment)
            .Where(s => assignmentIds.Contains(s.AssignmentId) && s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAt)
            .Select(s => new
            {
                s.Id,
                s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                AssignmentMaxMarks = s.Assignment.MaxMarks,
                s.FileName,
                s.FileUrl,
                s.FileSize,
                s.SubmittedAt,
                Status = s.Status.ToString(),
                s.Marks,
                s.Feedback
            })
            .ToListAsync();

        var studentGradedMarks = submissions.Where(s => s.Marks.HasValue).Select(s => s.Marks).ToList();
        var averageMark = studentGradedMarks.Count > 0 ? studentGradedMarks.Average() : (decimal?)null;

        return Ok(new
        {
            StudentId = student.Id,
            StudentName = student.Name,
            StudentEmail = student.Email,
            ClassId = cls.Id,
            ClassName = cls.Name,
            ClassGradeLevel = cls.GradeLevel,
            TotalAssignedTasks = classAssignments.Count,
            SubmittedTasksCount = submissions.Count,
            GradedTasksCount = submissions.Count(s => s.Status == "Graded"),
            AverageMark = averageMark,
            Submissions = submissions
        });
    }
}
