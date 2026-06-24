using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class QualityManualInput : BaseEntity
{
    public Guid DonViCongDoanId { get; set; }
    public Guid QualityEvaluationPeriodId { get; set; }
    public Guid QualityCriteriaId { get; set; }
    public double GiaTri { get; set; }
    public DateTime NgayCapNhat { get; set; } = DateTime.Now;
    public string? NguoiCapNhat { get; set; }

    // Navigation properties
    public virtual DonViCongDoan? DonViCongDoan { get; set; }
    public virtual QualityEvaluationPeriod? QualityEvaluationPeriod { get; set; }
    public virtual QualityCriteria? QualityCriteria { get; set; }
}
