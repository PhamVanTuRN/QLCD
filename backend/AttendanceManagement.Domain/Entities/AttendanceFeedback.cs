using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceFeedback : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid PersonId { get; set; }
    public required string Content { get; set; }
    public required string Status { get; set; } // PENDING, REVIEWED, APPROVED, REJECTED
    public string? ReviewNotes { get; set; }

    public virtual Event Event { get; set; } = null!;
    public virtual Person Person { get; set; } = null!;
}
