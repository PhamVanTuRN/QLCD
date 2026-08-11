using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class EventLocation : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid LocationId { get; set; }
    
    public DateTime? StartTimeOverride { get; set; }
    public DateTime? EndTimeOverride { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    public virtual Event Event { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
}
