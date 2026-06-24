using System;
using System.Collections.Generic;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class QualityEvaluation : BaseEntity
{
    public Guid DonViCongDoanId { get; set; }
    public Guid QualityEvaluationPeriodId { get; set; }
    public double TongDiem { get; set; }
    public required string XepLoai { get; set; }
    public int DatSoTieuChi { get; set; }
    public int TongSoTieuChi { get; set; }
    public string? NguoiDanhGia { get; set; }
    public DateTime NgayDanhGia { get; set; } = DateTime.Now;
    public string? GhiChu { get; set; }

    // Navigation properties
    public virtual DonViCongDoan? DonViCongDoan { get; set; }
    public virtual QualityEvaluationPeriod? QualityEvaluationPeriod { get; set; }
    public virtual ICollection<QualityEvaluationDetail> Details { get; set; } = new List<QualityEvaluationDetail>();
}
