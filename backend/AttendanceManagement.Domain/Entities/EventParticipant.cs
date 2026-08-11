using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class EventParticipant : BaseEntity
{
    public Guid EventId { get; set; }
    public Guid? PersonId { get; set; }
    public Guid? AssignedLocationId { get; set; }
    public string Status { get; set; } = "REGISTERED"; // REGISTERED, CANCELLED
    
    // Type: ALL_HOSPITAL, BY_DEPARTMENT, SPECIFIC_PERSONS
    public string ParticipantType { get; set; } = "SPECIFIC_PERSONS";
    public Guid? DepartmentId { get; set; } // If ParticipantType == BY_DEPARTMENT
    
    public bool IsRequired { get; set; } = true;

    public virtual Event Event { get; set; } = null!;
    public virtual Person? Person { get; set; }
    public virtual Department? Department { get; set; }
    public virtual Location? AssignedLocation { get; set; }
}
