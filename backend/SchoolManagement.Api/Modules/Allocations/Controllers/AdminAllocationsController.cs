using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Allocations.Controllers;

public record AssignTeacherDto(Guid ClassId, Guid SubjectId, Guid TeacherId);
public record EnrollStudentDto(Guid ClassId, Guid StudentId);

[ApiController]
[Route("api/admin/allocations")]
[Authorize(Roles = "Admin")]
public class AdminAllocationsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminAllocationsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("teacher-assignments")]
    public async Task<IActionResult> GetTeacherAssignments()
    {
        var assignments = await _db.ClassSubjectTeachers
            .Include(c => c.Class)
            .Include(c => c.Subject)
            .Include(c => c.Teacher)
            .Select(c => new
            {
                c.Id,
                c.ClassId,
                ClassName = c.Class.Name,
                c.SubjectId,
                SubjectName = c.Subject.Name,
                c.TeacherId,
                TeacherName = c.Teacher.Name
            })
            .ToListAsync();

        return Ok(assignments);
    }

    [HttpPost("assign-teacher")]
    public async Task<IActionResult> AssignTeacher([FromBody] AssignTeacherDto dto)
    {
        var teacher = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.TeacherId && u.Role == UserRole.Teacher);
        if (teacher == null) return BadRequest(new { message = "Invalid teacher account selected." });

        var exists = await _db.ClassSubjectTeachers.AnyAsync(c => c.ClassId == dto.ClassId && c.SubjectId == dto.SubjectId && c.TeacherId == dto.TeacherId);
        if (exists) return BadRequest(new { message = "Teacher is already assigned to this class and subject." });

        var allocation = new ClassSubjectTeacher
        {
            ClassId = dto.ClassId,
            SubjectId = dto.SubjectId,
            TeacherId = dto.TeacherId
        };

        _db.ClassSubjectTeachers.Add(allocation);
        await _db.SaveChangesAsync();

        return Ok(allocation);
    }

    [HttpGet("student-enrollments")]
    public async Task<IActionResult> GetStudentEnrollments()
    {
        var enrollments = await _db.ClassStudents
            .Include(c => c.Class)
            .Include(c => c.Student)
            .Select(c => new
            {
                c.Id,
                c.ClassId,
                ClassName = c.Class.Name,
                c.StudentId,
                StudentName = c.Student.Name,
                StudentEmail = c.Student.Email
            })
            .ToListAsync();

        return Ok(enrollments);
    }

    [HttpPost("enroll-student")]
    public async Task<IActionResult> EnrollStudent([FromBody] EnrollStudentDto dto)
    {
        var student = await _db.Users.FirstOrDefaultAsync(u => u.Id == dto.StudentId && u.Role == UserRole.Student);
        if (student == null) return BadRequest(new { message = "Invalid student account selected." });

        var exists = await _db.ClassStudents.AnyAsync(c => c.ClassId == dto.ClassId && c.StudentId == dto.StudentId);
        if (exists) return BadRequest(new { message = "Student is already enrolled in this class." });

        var enrollment = new ClassStudent
        {
            ClassId = dto.ClassId,
            StudentId = dto.StudentId
        };

        _db.ClassStudents.Add(enrollment);
        await _db.SaveChangesAsync();

        return Ok(enrollment);
    }
}
