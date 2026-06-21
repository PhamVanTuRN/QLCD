using System;
using QLCD.Domain.Common;
using QLCD.Domain.Enums;

namespace QLCD.Domain.Entities;

public class LichSuBienDong : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public LoaiBienDong LoaiBienDong { get; set; }
    public Guid? TuToCongDoanId { get; set; }
    public Guid? DenToCongDoanId { get; set; }
    public required string LyDo { get; set; }
    public DateTime NgayHieuLuc { get; set; }
    public Guid NguoiThucHienId { get; set; }
    public string? FileMinhChungUrl { get; set; }

    // Navigation properties
    public virtual DoanVien? DoanVien { get; set; }
    public virtual DonViCongDoan? TuToCongDoan { get; set; }
    public virtual DonViCongDoan? DenToCongDoan { get; set; }
}
