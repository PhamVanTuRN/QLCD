using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class TaiChinhCongDoan : BaseEntity
{
    public Guid DonViId { get; set; }
    public required string LoaiGiaoDich { get; set; } // Reference code to DanhMucDungChung
    public decimal SoTien { get; set; }
    public DateTime NgayGiaoDich { get; set; }
    public required string NguoiGiaoDich { get; set; }
    public Guid? DoanVienId { get; set; }            // Optional link for individual dues tracking
    public string? ThangNam { get; set; }             // format "MM/yyyy"
    public string? GhiChu { get; set; }
    
    // Navigation properties
    public virtual DonViCongDoan? DonVi { get; set; }
    public virtual DoanVien? DoanVien { get; set; }
}
