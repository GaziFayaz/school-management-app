using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SchoolManagement.Api.BuildingBlocks.Auth;
using SchoolManagement.Api.Infrastructure.Data;
using SchoolManagement.Api.Modules.Auth.Controllers;
using SchoolManagement.Api.Modules.Users.Models;
using Xunit;

namespace SchoolManagement.Tests.Auth;

public class AuthTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsTokenAndUserRole()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var user = new User
        {
            Name = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = UserRole.Admin
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var jwtOptions = Options.Create(new JwtOptions());
        var tokenGenerator = new JwtTokenGenerator(jwtOptions);
        var controller = new AuthController(db, tokenGenerator);

        // Act
        var result = await controller.Login(new LoginRequest("admin@test.com", "Admin@123"));

        // Assert
        var okResult = Assert.IsType<Microsoft.AspNetCore.Mvc.OkObjectResult>(result);
        var response = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.NotNull(response.Token);
        Assert.Equal("Admin", response.Role);
    }

    [Fact]
    public async Task Login_InvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var user = new User
        {
            Name = "Test Admin",
            Email = "admin@test.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role = UserRole.Admin
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var jwtOptions = Options.Create(new JwtOptions());
        var tokenGenerator = new JwtTokenGenerator(jwtOptions);
        var controller = new AuthController(db, tokenGenerator);

        // Act
        var result = await controller.Login(new LoginRequest("admin@test.com", "WrongPassword"));

        // Assert
        Assert.IsType<Microsoft.AspNetCore.Mvc.UnauthorizedObjectResult>(result);
    }
}
