using SchoolManagement.Api.Modules.Assignments.Models;
using SchoolManagement.Api.Modules.Users.Models;

namespace SchoolManagement.Api.Modules.Submissions.Models;

public enum SubmissionStatus
{
    Submitted = 1,
    Graded = 2,
    Returned = 3
}

public class Submission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AssignmentId { get; set; }
    public Assignment Assignment { get; set; } = null!;

    public Guid StudentId { get; set; }
    public User Student { get; set; } = null!;

    public string FileUrl { get; set; } = string.Empty;
    public string FileKey { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }

    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public SubmissionStatus Status { get; set; } = SubmissionStatus.Submitted;

    public decimal? Marks { get; set; }
    public string? Feedback { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
