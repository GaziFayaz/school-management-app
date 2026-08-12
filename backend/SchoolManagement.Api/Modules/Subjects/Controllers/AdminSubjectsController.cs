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
        if (await _db.Subjects.AnyAsync(s => s.Code == dto.Code))
        {
            return BadRequest(new { message = "Subject code already exists." });
        }

        var subject = new Subject
        {
            Name = dto.Name,
            Code = dto.Code
        };

        _db.Subjects.Add(subject);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSubjects), new { id = subject.Id }, subject);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSubject(Guid id)
    {
        var subject = await _db.Subjects.FindAsync(id);
        if (subject == null) return NotFound();

        _db.Subjects.Remove(subject);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
