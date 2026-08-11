using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class Person : BaseEntity
{
    public Guid DepartmentId { get; set; }
    public required string CCCD { get; set; }
    public required string Code { get; set; }
    public required string FullName { get; set; }
    public bool Status { get; set; } = true;

    public virtual Department Department { get; set; } = null!;
}
