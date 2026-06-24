using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class QualityEvaluationPeriod : BaseEntity
{
    public int Nam { get; set; }
    public required string Ky { get; set; } // Q1, Q2, Q3, Q4, YEAR
    public required string TenKy { get; set; }
    public int TrangThai { get; set; } = 1; // 0: Closed, 1: Open, 2: Locked
}
