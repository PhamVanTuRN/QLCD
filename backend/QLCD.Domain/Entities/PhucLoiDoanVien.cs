using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class PhucLoiDoanVien : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public Guid DonViId { get; set; }
    public required string LoaiPhucLoi { get; set; } // Reference code to DanhMucDungChung
    public decimal KinhPhiHoTro { get; set; }
    public DateTime NgayHoTro { get; set; }
    public required string LyDo { get; set; }
    public int TrangThai { get; set; } = 1;          // 1: Pending, 2: Approved, 3: Rejected
    public string? FileMinhChungUrl { get; set; }
    
    // Navigation properties
    public virtual DoanVien? DoanVien { get; set; }
    public virtual DonViCongDoan? DonVi { get; set; }
}
