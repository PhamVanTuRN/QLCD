namespace QLCD.Domain.Entities;

public sealed class AuthSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AccountId { get; set; }
    public TaiKhoan Account { get; set; } = null!;
    public Guid SecurityVersion { get; set; }
    public required string TokenHash { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
}
