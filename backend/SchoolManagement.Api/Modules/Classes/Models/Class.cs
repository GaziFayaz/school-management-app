namespace SchoolManagement.Api.Modules.Classes.Models;

public class Class
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string GradeLevel { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
}
