using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceRule : BaseEntity
{
    public Guid EventSessionId { get; set; }
    
    // Type of rule: CHECK_IN, CHECK_OUT
    public required string AttendanceType { get; set; } 
    
    public TimeSpan WindowStart { get; set; }
    public TimeSpan ReferenceTime { get; set; }
    public TimeSpan WindowEnd { get; set; }
    
    public bool Required { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    
    public bool IsActive { get; set; } = true;

    public virtual EventSession EventSession { get; set; } = null!;
}
