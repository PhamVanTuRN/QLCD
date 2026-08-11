using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class EventDevice : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid LocationId { get; set; }
    public Guid DeviceId { get; set; }

    public virtual Event Event { get; set; } = null!;
    public virtual Location Location { get; set; } = null!;
    public virtual AttendanceDevice Device { get; set; } = null!;
}
