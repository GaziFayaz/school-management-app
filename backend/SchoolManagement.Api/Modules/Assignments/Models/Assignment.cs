using SchoolManagement.Api.Modules.Classes.Models;
using SchoolManagement.Api.Modules.Subjects.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Assignments.Models;

public enum AssignmentStatus
{
    Draft = 1,
    Published = 2
}

public class Assignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public decimal MaxMarks { get; set; }

    public Guid ClassId { get; set; }
    public Class Class { get; set; } = null!;

    public Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;

    public Guid TeacherId { get; set; }
    public User Teacher { get; set; } = null!;

    public AssignmentStatus Status { get; set; } = AssignmentStatus.Draft;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
