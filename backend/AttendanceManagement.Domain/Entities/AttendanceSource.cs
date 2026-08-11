using System;
using System.Collections.Generic;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceSource : BaseEntity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public bool Status { get; set; } = true;
}
