using System;
using System.Collections.Generic;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class Department : BaseEntity
{
    public Guid? ParentId { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public bool Status { get; set; } = true;
    
    public virtual Department? Parent { get; set; }
    public virtual ICollection<Department> Children { get; set; } = new List<Department>();
    public virtual ICollection<Person> Persons { get; set; } = new List<Person>();
}
