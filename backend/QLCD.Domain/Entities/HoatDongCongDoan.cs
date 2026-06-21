using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class HoatDongCongDoan : BaseEntity
{
    public Guid DonViId { get; set; }
    public required string TenHoatDong { get; set; }
    public string? MoTa { get; set; }
    public required string LoaiHoatDong { get; set; } // Reference code to DanhMucDungChung
    public DateTime TuNgay { get; set; }
    public DateTime DenNgay { get; set; }
    public required string DiaDiem { get; set; }
    public string? MaQRCode { get; set; }
    public decimal KinhPhi { get; set; }
    public string? KetQua { get; set; }
    public string? FileMinhChungUrl { get; set; }
    
    // Navigation properties
    public virtual DonViCongDoan? DonVi { get; set; }
}
