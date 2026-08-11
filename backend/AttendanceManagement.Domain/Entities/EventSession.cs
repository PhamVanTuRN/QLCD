using System;
using System.Collections.Generic;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class EventSession : BaseEntity
{
    public Guid EventId { get; set; }
    
    public required string SessionName { get; set; }
    
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    
    public int DisplayOrder { get; set; } = 0;
    public string? Status { get; set; } // e.g. ACTIVE, CANCELLED
    
    public bool IsActive { get; set; } = true;

    public virtual Event Event { get; set; } = null!;
    public virtual ICollection<AttendanceRule> AttendanceRules { get; set; } = new List<AttendanceRule>();
}
