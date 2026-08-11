using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class UserAccount : BaseEntity
{
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public required string FullName { get; set; }
    public required string Role { get; set; } // SYSTEM_ADMIN, ATTENDANCE_ADMIN, EVENT_MANAGER, UNIT_MANAGER, USER
    public Guid? PersonId { get; set; }
    public Guid? DepartmentId { get; set; }
    public bool Status { get; set; } = true;

    public virtual Person? Person { get; set; }
    public virtual Department? Department { get; set; }
}
