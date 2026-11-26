using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class TaiKhoan : BaseEntity
{
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public required string HoTen { get; set; }
    public required string VaiTro { get; set; } // ADMIN, CDCS, CDBP, TOCD, DOANVIEN
    public Guid? OrganizationId { get; set; }    // NULL context for ADMIN, otherwise linked to DonViCongDoan
    public Guid SecurityVersion { get; set; } = Guid.NewGuid();
    public bool MustChangePassword { get; set; }
    public bool RecommendPasswordChange { get; set; }
    public DateTime? TemporaryPasswordExpiresUtc { get; set; }
    public string? ProtectedMfaSecret { get; set; }
    public string? ActivationCodeHash { get; set; }
    public DateTime? ActivationCodeExpiresUtc { get; set; }
    public string? RecoveryCodeHashes { get; set; }
    public long? LastMfaStep { get; set; }
    public bool TrangThai { get; set; } = true;
    
    // Navigation properties
    public virtual DonViCongDoan? Organization { get; set; }
}
