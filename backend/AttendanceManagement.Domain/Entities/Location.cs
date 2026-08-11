using System;
using System.Collections.Generic;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class Location : BaseEntity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    
    public string? PhysicalLocation { get; set; }
    public int Capacity { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    
    public virtual ICollection<AttendanceDevice> AttendanceDevices { get; set; } = new List<AttendanceDevice>();
}
