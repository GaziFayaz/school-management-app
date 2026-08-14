using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Users.Controllers;

public record CreateUserDto(
    [Required(ErrorMessage = "Name is required."), StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")] string Name,
    [Required(ErrorMessage = "Email is required."), EmailAddress(ErrorMessage = "Invalid email format.")] string Email,
    [Required(ErrorMessage = "Password is required."), StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters long.")] string Password,
    [Required(ErrorMessage = "Role is required.")] UserRole Role
);

public record UpdateUserDto(
    [Required(ErrorMessage = "Name is required."), StringLength(100, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 100 characters.")] string Name,
    [Required(ErrorMessage = "Email is required."), EmailAddress(ErrorMessage = "Invalid email format.")] string Email,
    [Required(ErrorMessage = "Role is required.")] UserRole Role
);

public record UserResponseDto(Guid Id, string Name, string Email, string Role, DateTime CreatedAt);

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminUsersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] string? role)
    {
        var query = _db.Users.AsQueryable();

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, true, out var parsedRole))
        {
            query = query.Where(u => u.Role == parsedRole);
        }

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserResponseDto(u.Id, u.Name, u.Email, u.Role.ToString(), u.CreatedAt))
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserDetail(Guid id)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == id);
        if (user == null) return NotFound(new { message = "User not found." });

        object? roleDetails = null;

        if (user.Role == UserRole.Teacher)
        {
            var assignedClasses = await _db.ClassSubjectTeachers
                .Include(c => c.Class)
                .Include(c => c.Subject)
                .Where(c => c.TeacherId == id)
                .Select(c => new
                {
                    c.ClassId,
                    ClassName = c.Class.Name,
                    GradeLevel = c.Class.GradeLevel,
                    c.SubjectId,
                    SubjectName = c.Subject.Name,
                    SubjectCode = c.Subject.Code
                })
                .ToListAsync();

            roleDetails = new { assignedClasses };
        }
        else if (user.Role == UserRole.Student)
        {
            var enrollments = await _db.ClassStudents
                .Include(c => c.Class)
                .Where(c => c.StudentId == id)
                .Select(c => new
                {
                    c.ClassId,
                    ClassName = c.Class.Name,
                    GradeLevel = c.Class.GradeLevel
                })
                .ToListAsync();

            var totalSubmissions = await _db.Submissions.CountAsync(s => s.StudentId == id);
            var gradedSubmissions = await _db.Submissions.CountAsync(s => s.StudentId == id && s.Status == Submissions.Models.SubmissionStatus.Graded);

            roleDetails = new
            {
                enrolledClass = enrollments.FirstOrDefault(), // Backward compatibility for single-class UI
                enrolledClasses = enrollments,                // Full multi-class support
                totalSubmissions,
                gradedSubmissions
            };
        }

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            Role = user.Role.ToString(),
            user.CreatedAt,
            roleDetails
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return BadRequest(new { message = "Email is already registered." });
        }

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role
        };

        try
        {
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Email is already registered." });
        }

        return CreatedAtAction(nameof(GetUsers), new { id = user.Id }, new UserResponseDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.CreatedAt));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound(new { message = "User not found." });

        var normalizedEmail = dto.Email.Trim().ToLowerInvariant();
        if (user.Email.ToLower() != normalizedEmail && await _db.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail && u.Id != id))
        {
            return BadRequest(new { message = "Email is already in use by another user." });
        }

        user.Name = dto.Name.Trim();
        user.Email = normalizedEmail;
        user.Role = dto.Role;

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "Email is already in use by another user." });
        }

        return Ok(new UserResponseDto(user.Id, user.Name, user.Email, user.Role.ToString(), user.CreatedAt));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsDeleted = true;
        user.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
