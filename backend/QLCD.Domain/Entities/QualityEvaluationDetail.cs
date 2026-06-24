using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class QualityEvaluationDetail : BaseEntity
{
    public Guid QualityEvaluationId { get; set; }
    public Guid QualityCriteriaId { get; set; }
    public double MucTieu { get; set; }
    public double ThucTe { get; set; }
    public bool IsPassed { get; set; }
    public double DiemSo { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public string? GhiChu { get; set; }

    // Navigation properties
    public virtual QualityEvaluation? QualityEvaluation { get; set; }
    public virtual QualityCriteria? QualityCriteria { get; set; }
}
