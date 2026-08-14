using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.BuildingBlocks.Auth;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Auth.Controllers;

public record LoginRequest(
    [Required(ErrorMessage = "Email address is required."), EmailAddress(ErrorMessage = "Invalid email format.")] string Email,
    [Required(ErrorMessage = "Password is required.")] string Password
);
public record AuthResponse(string Token, Guid Id, string Name, string Email, string Role);

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthController(AppDbContext db, IJwtTokenGenerator jwtTokenGenerator)
    {
        _db = db;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var token = _jwtTokenGenerator.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Id, user.Name, user.Email, user.Role.ToString()));
    }
}
