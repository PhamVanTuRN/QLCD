using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class QualityCriteria : BaseEntity
{
    public required string Ma { get; set; }
    public required string Ten { get; set; }
    public required string PhanLoai { get; set; }
    public double MucTieu { get; set; }
    public required string DonViTinh { get; set; }
    public bool IsInverse { get; set; }
    public int ThuTu { get; set; }
    public bool TrangThai { get; set; } = true;
    public string? MoTa { get; set; }
    public string? AutoCalculationKey { get; set; }
}
