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
    public string? PasswordRaw { get; set; }      // Tmp raw password visible on creation
    public bool TrangThai { get; set; } = true;
    
    // Navigation properties
    public virtual DonViCongDoan? Organization { get; set; }
}
