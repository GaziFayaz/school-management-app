using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (!await db.Users.AnyAsync())
        {
            var admin = new User
            {
                Name = "System Administrator",
                Email = "admin@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = UserRole.Admin
            };

            var teacher = new User
            {
                Name = "Sarah Jenkins",
                Email = "teacher@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Teacher@123"),
                Role = UserRole.Teacher
            };

            var student = new User
            {
                Name = "Alex Rivera",
                Email = "student@school.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student@123"),
                Role = UserRole.Student
            };

            db.Users.AddRange(admin, teacher, student);
            await db.SaveChangesAsync();

            var grade10 = new Class
            {
                Name = "Grade 10-A",
                GradeLevel = "Grade 10"
            };
            db.Classes.Add(grade10);

            var math = new Subject
            {
                Name = "Mathematics",
                Code = "MATH101"
            };
            db.Subjects.Add(math);
            await db.SaveChangesAsync();

            var allocation = new ClassSubjectTeacher
            {
                ClassId = grade10.Id,
                SubjectId = math.Id,
                TeacherId = teacher.Id
            };
            db.ClassSubjectTeachers.Add(allocation);

            var enrollment = new ClassStudent
            {
                ClassId = grade10.Id,
                StudentId = student.Id
            };
            db.ClassStudents.Add(enrollment);
            await db.SaveChangesAsync();

            var sampleAssignment = new Assignment
            {
                Title = "Algebra & Quadratic Equations Problem Set",
                Description = "Complete all problems in Chapter 4 (pages 82-85). Show complete steps and submit your answers in PDF format.",
                Deadline = DateTime.UtcNow.AddDays(7),
                MaxMarks = 100,
                ClassId = grade10.Id,
                SubjectId = math.Id,
                TeacherId = teacher.Id,
                Status = AssignmentStatus.Published
            };
            db.Assignments.Add(sampleAssignment);
            await db.SaveChangesAsync();
        }
    }
}
