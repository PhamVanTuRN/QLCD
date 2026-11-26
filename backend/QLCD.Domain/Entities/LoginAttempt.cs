namespace QLCD.Domain.Entities;

public sealed class LoginAttempt
{
    public required string Key { get; set; }
    public int FailedLoginAttempts { get; set; }
    public DateTime? LockoutEndUtc { get; set; }
    public DateTime LastFailureUtc { get; set; }
}
