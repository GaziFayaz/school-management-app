using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Subjects.Models;

namespace SchoolManagement.Api.Modules.Subjects.Controllers;

public record CreateSubjectDto(string Name, string Code);

[ApiController]
[Route("api/admin/subjects")]
[Authorize(Roles = "Admin")]
public class AdminSubjectsController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminSubjectsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetSubjects()
    {
        var subjects = await _db.Subjects.OrderBy(s => s.Name).ToListAsync();
        return Ok(subjects);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSubject([FromBody] CreateSubjectDto dto)
    {
        if (await _db.Subjects.AnyAsync(s => s.Code.ToLower() == dto.Code.Trim().ToLower()))
        {
            return BadRequest(new { message = "Subject code already exists." });
        }

        var subject = new Subject
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim().ToUpperInvariant()
        };

        try
        {
            _db.Subjects.Add(subject);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Subject code already exists." });
        }

        return CreatedAtAction(nameof(GetSubjects), new { id = subject.Id }, subject);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSubject(Guid id, [FromBody] CreateSubjectDto dto)
    {
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null) return NotFound(new { message = "Subject not found." });

        if (subject.Code.ToLower() != dto.Code.Trim().ToLower() && await _db.Subjects.AnyAsync(s => s.Code.ToLower() == dto.Code.Trim().ToLower() && s.Id != id))
        {
            return BadRequest(new { message = "Subject code is already in use." });
        }

        subject.Name = dto.Name.Trim();
        subject.Code = dto.Code.Trim().ToUpperInvariant();

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Subject code is already in use." });
        }

        return Ok(subject);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSubject(Guid id)
    {
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null) return NotFound();

        var inUse = await _db.ClassSubjectTeachers.AnyAsync(c => c.SubjectId == id);
        if (inUse)
        {
            return BadRequest(new { message = "Cannot delete subject because it is currently assigned to one or more teachers." });
        }

        subject.IsDeleted = true;
        subject.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
