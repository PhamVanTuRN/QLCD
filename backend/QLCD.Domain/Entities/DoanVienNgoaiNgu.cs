using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class DoanVienNgoaiNgu : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public required string NgoaiNgu { get; set; } // Tiếng Anh, Tiếng Nga, Tiếng Pháp...
    public required string TrinhDo { get; set; } // IELTS, TOEIC, A, B, C...
    public decimal DiemSo { get; set; }
    public DateTime NgayCap { get; set; }
    public string? DonViCap { get; set; }
    public DateTime? NgayHetHan { get; set; }
    public string? FileChungChiUrl { get; set; }

    // Navigation properties
    public virtual DoanVien? DoanVien { get; set; }
}
