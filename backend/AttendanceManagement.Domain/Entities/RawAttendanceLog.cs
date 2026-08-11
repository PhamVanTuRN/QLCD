using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class RawAttendanceLog : BaseEntity
{
    // Basic mapping
    public Guid? UserId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    
    // Extracted mapping (can be null initially, populated by inference engine)
    public Guid? EventId { get; set; }
    public Guid? LocationId { get; set; } // Hall
    public Guid? DeviceId { get; set; }
    
    public DateTime AttendanceTime { get; set; }
    public required string AttendanceMethod { get; set; } // FACE, QR, CARD, MANUAL, IMPORT, OTHER
    
    // External tracking
    public string? ExternalLogId { get; set; }
    public string? SourceSystem { get; set; }
    public string? RawPayload { get; set; }
    
    // Recognition details
    public decimal? RecognitionScore { get; set; }
    
    // Validation
    public bool IsValid { get; set; } = true;
    public string? ValidationMessage { get; set; }
    
    public DateTime ImportedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public virtual Event? Event { get; set; }
    public virtual Location? Location { get; set; }
    public virtual AttendanceDevice? Device { get; set; }
    public virtual Person? Person { get; set; }
    public virtual UserAccount? User { get; set; }
}
