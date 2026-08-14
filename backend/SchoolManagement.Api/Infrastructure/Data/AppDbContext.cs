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
            entity.HasQueryFilter(u => !u.IsDeleted);
            entity.HasIndex(u => u.Email).IsUnique().HasFilter("\"IsDeleted\" = false");
        });

        modelBuilder.Entity<Class>(entity =>
        {
            entity.HasQueryFilter(c => !c.IsDeleted);
            entity.HasIndex(c => new { c.Name, c.GradeLevel }).IsUnique().HasFilter("\"IsDeleted\" = false");
        });

        modelBuilder.Entity<Subject>(entity =>
        {
            entity.HasQueryFilter(s => !s.IsDeleted);
            entity.HasIndex(s => s.Code).IsUnique().HasFilter("\"IsDeleted\" = false");
        });

        modelBuilder.Entity<ClassSubjectTeacher>(entity =>
        {
            entity.HasQueryFilter(cst => !cst.Class.IsDeleted && !cst.Subject.IsDeleted && !cst.Teacher.IsDeleted);
            entity.HasIndex(cst => new { cst.ClassId, cst.SubjectId, cst.TeacherId }).IsUnique();
            entity.HasOne(c => c.Class).WithMany().HasForeignKey(c => c.ClassId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Subject).WithMany().HasForeignKey(c => c.SubjectId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Teacher).WithMany().HasForeignKey(c => c.TeacherId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ClassStudent>(entity =>
        {
            entity.HasQueryFilter(cs => !cs.Class.IsDeleted && !cs.Student.IsDeleted);
            entity.HasIndex(cs => new { cs.ClassId, cs.StudentId }).IsUnique();
            entity.HasOne(c => c.Class).WithMany().HasForeignKey(c => c.ClassId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(c => c.Student).WithMany().HasForeignKey(c => c.StudentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Assignment>(entity =>
        {
            entity.HasQueryFilter(a => !a.IsDeleted);
            entity.Property(a => a.MaxMarks).HasPrecision(5, 2);
            entity.HasOne(a => a.Class).WithMany().HasForeignKey(a => a.ClassId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Subject).WithMany().HasForeignKey(a => a.SubjectId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Teacher).WithMany().HasForeignKey(a => a.TeacherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Submission>(entity =>
        {
            entity.HasQueryFilter(s => !s.IsDeleted);
            entity.HasIndex(s => new { s.AssignmentId, s.StudentId }).IsUnique().HasFilter("\"IsDeleted\" = false");
            entity.Property(s => s.Marks).HasPrecision(5, 2);
            entity.HasOne(s => s.Assignment).WithMany().HasForeignKey(s => s.AssignmentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(s => s.Student).WithMany().HasForeignKey(s => s.StudentId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
