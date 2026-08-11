using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceResult : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid? UserId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    
    public DateTime? FirstAttendanceTime { get; set; }
    public DateTime? LastAttendanceTime { get; set; }
    
    public int TotalLogs { get; set; } = 0;
    public int ValidLogs { get; set; } = 0;
    
    public int CompletedRequiredWindows { get; set; } = 0;
    public int RequiredWindows { get; set; } = 0;
    
    // Status: PENDING, PRESENT, ABSENT, INCOMPLETE, LATE, EARLY_LEAVE, INVALID, MANUAL_APPROVED
    public required string AttendanceStatus { get; set; } 
    public string? ResultReason { get; set; }
    
    public DateTime CalculatedAt { get; set; } = DateTime.UtcNow;
    
    // Manual override
    public bool IsManualOverride { get; set; } = false;
    public string? ManualOverrideReason { get; set; }

    public virtual Event Event { get; set; } = null!;
    public virtual Person? Person { get; set; }
    public virtual UserAccount? User { get; set; }
}
