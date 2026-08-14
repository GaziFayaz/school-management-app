using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Classes.Models;

namespace SchoolManagement.Api.Modules.Classes.Controllers;

public record CreateClassDto(
    [Required(ErrorMessage = "Class name is required."), StringLength(50, MinimumLength = 1, ErrorMessage = "Class name must be between 1 and 50 characters.")] string Name,
    [Required(ErrorMessage = "Grade level is required."), StringLength(50, MinimumLength = 1, ErrorMessage = "Grade level must be between 1 and 50 characters.")] string GradeLevel
);

[ApiController]
[Route("api/admin/classes")]
[Authorize(Roles = "Admin")]
public class AdminClassesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminClassesController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous] // Teachers and Students can also query available classes
    public async Task<IActionResult> GetClasses()
    {
        var classes = await _db.Classes.OrderBy(c => c.Name).ToListAsync();
        return Ok(classes);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetClassDetail(Guid id)
    {
        var cls = await _db.Classes.FirstOrDefaultAsync(c => c.Id == id);
        if (cls == null) return NotFound(new { message = "Class not found." });

        var teacherAssignments = await _db.ClassSubjectTeachers
            .Include(c => c.Teacher)
            .Include(c => c.Subject)
            .Where(c => c.ClassId == id)
            .Select(c => new
            {
                c.Id,
                c.TeacherId,
                TeacherName = c.Teacher.Name,
                TeacherEmail = c.Teacher.Email,
                c.SubjectId,
                SubjectName = c.Subject.Name,
                SubjectCode = c.Subject.Code
            })
            .ToListAsync();

        var studentEnrollments = await _db.ClassStudents
            .Include(c => c.Student)
            .Where(c => c.ClassId == id)
            .Select(c => new
            {
                c.Id,
                c.StudentId,
                StudentName = c.Student.Name,
                StudentEmail = c.Student.Email
            })
            .ToListAsync();

        return Ok(new
        {
            cls.Id,
            cls.Name,
            cls.GradeLevel,
            teacherAssignments,
            studentEnrollments
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
    {
        var name = (dto.Name ?? string.Empty).Trim();
        var gradeLevel = (dto.GradeLevel ?? string.Empty).Trim();

        var exists = await _db.Classes.AnyAsync(c => c.Name.ToLower() == name.ToLower() && c.GradeLevel.ToLower() == gradeLevel.ToLower());
        if (exists)
        {
            return BadRequest(new { message = "A class with this name and grade level already exists." });
        }

        var newClass = new Class
        {
            Name = name,
            GradeLevel = gradeLevel
        };

        try
        {
            _db.Classes.Add(newClass);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "A class with this name and grade level already exists." });
        }

        return CreatedAtAction(nameof(GetClasses), new { id = newClass.Id }, newClass);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateClass(Guid id, [FromBody] CreateClassDto dto)
    {
        var cls = await _db.Classes.FindAsync(id);
        if (cls == null) return NotFound(new { message = "Class not found." });

        var name = (dto.Name ?? string.Empty).Trim();
        var gradeLevel = (dto.GradeLevel ?? string.Empty).Trim();

        var exists = await _db.Classes.AnyAsync(c => c.Id != id && c.Name.ToLower() == name.ToLower() && c.GradeLevel.ToLower() == gradeLevel.ToLower());
        if (exists)
        {
            return BadRequest(new { message = "A class with this name and grade level already exists." });
        }

        cls.Name = name;
        cls.GradeLevel = gradeLevel;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "A class with this name and grade level already exists." });
        }

        return Ok(cls);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClass(Guid id)
    {
        var cls = await _db.Classes.FindAsync(id);
        if (cls == null) return NotFound();

        cls.IsDeleted = true;
        cls.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
