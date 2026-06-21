using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class SangKien : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public Guid DonViId { get; set; }
    public required string TenDeTai { get; set; }
    public required string LinhVuc { get; set; }
    public required string CapDeTai { get; set; }     // Reference code to DanhMucDungChung
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    public int NamThucHien { get; set; }
    public string? KetQuaNghiemThu { get; set; }
    public int TrangThai { get; set; } = 1;          // 1: Registered, 2: Approved/Passed, 3: Rejected
    
    // Navigation properties
    public virtual DoanVien? DoanVien { get; set; }
    public virtual DonViCongDoan? DonVi { get; set; }
}
