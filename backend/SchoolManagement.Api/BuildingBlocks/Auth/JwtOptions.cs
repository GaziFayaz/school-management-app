namespace SchoolManagement.Api.BuildingBlocks.Auth;

public class JwtOptions
{
    public string SecretKey { get; set; } = "SuperSecretKeyForAssignmentAndSubmissionManagementSystem2026!";
    public string Issuer { get; set; } = "SchoolManagementApi";
    public string Audience { get; set; } = "SchoolManagementApp";
    public int ExpiryMinutes { get; set; } = 1440;
}
