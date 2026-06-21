using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class ThiDuaCongDoan : BaseEntity
{
    public required string TenPhongTrao { get; set; }
    public Guid? DoanVienId { get; set; }            // Individual evaluation if not null
    public Guid? DonViId { get; set; }               // Collective evaluation if not null
    public int Nam { get; set; }
    public decimal DiemTuDanhGia { get; set; }
    public decimal DiemBchDuyet { get; set; }
    public required string XepLoai { get; set; }     // Reference code to DanhMucDungChung
    public string? KhenThuong { get; set; }
    public int TrangThai { get; set; } = 1;          // 1: Registered, 2: Evaluated, 3: Awarded
    
    // Navigation properties
    public virtual DoanVien? DoanVien { get; set; }
    public virtual DonViCongDoan? DonVi { get; set; }
}
