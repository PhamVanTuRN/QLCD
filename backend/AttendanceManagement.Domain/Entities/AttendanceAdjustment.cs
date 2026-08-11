using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceAdjustment : BaseEntity
{
    public Guid ResultId { get; set; }
    public Guid PersonId { get; set; }
    public required string AdjustmentType { get; set; } // UPDATE_STATUS, UPDATE_TIME
    public required string Reason { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? EvidenceUrl { get; set; }
    public Guid AdjustedByUserId { get; set; }

    public virtual AttendanceResult Result { get; set; } = null!;
    public virtual Person Person { get; set; } = null!;
    public virtual UserAccount AdjustedByUser { get; set; } = null!;
}
