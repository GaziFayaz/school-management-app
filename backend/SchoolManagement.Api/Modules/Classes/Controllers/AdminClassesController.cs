using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Classes.Models;

namespace SchoolManagement.Api.Modules.Classes.Controllers;

public record CreateClassDto(string Name, string GradeLevel);

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

    [HttpPost]
    public async Task<IActionResult> CreateClass([FromBody] CreateClassDto dto)
    {
        var newClass = new Class
        {
            Name = dto.Name,
            GradeLevel = dto.GradeLevel
        };

        _db.Classes.Add(newClass);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetClasses), new { id = newClass.Id }, newClass);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteClass(Guid id)
    {
        var cls = await _db.Classes.FindAsync(id);
        if (cls == null) return NotFound();

        _db.Classes.Remove(cls);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
