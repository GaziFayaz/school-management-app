using Microsoft.EntityFrameworkCore;
using SchoolManagement.Api.Modules.Allocations.Models;
using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Submissions.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<ClassSubjectTeacher> ClassSubjectTeachers => Set<ClassSubjectTeacher>();
    public DbSet<ClassStudent> ClassStudents => Set<ClassStudent>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasIndex(s => s.Code).IsUnique();
        });

        modelBuilder.Entity<ClassSubjectTeacher>(entity =>
        {
            entity.HasOne(c => c.Class).WithMany().HasForeignKey(c => c.ClassId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Subject).WithMany().HasForeignKey(c => c.SubjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Teacher).WithMany().HasForeignKey(c => c.TeacherId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClassStudent>(entity =>
        {
            entity.HasOne(c => c.Class).WithMany().HasForeignKey(c => c.ClassId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Student).WithMany().HasForeignKey(c => c.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.Property(a => a.MaxMarks).HasPrecision(5, 2);
            entity.HasOne(a => a.Class).WithMany().HasForeignKey(a => a.ClassId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Subject).WithMany().HasForeignKey(a => a.SubjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Teacher).WithMany().HasForeignKey(a => a.TeacherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.Property(s => s.Marks).HasPrecision(5, 2);
            entity.HasOne(s => s.Assignment).WithMany().HasForeignKey(s => s.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
