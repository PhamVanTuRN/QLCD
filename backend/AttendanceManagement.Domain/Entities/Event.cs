using System;
using System.Collections.Generic;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class Event : BaseEntity
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? EventType { get; set; }
    
    public required string Status { get; set; } // DRAFT, SCHEDULED, ACTIVE, COMPLETED, CANCELLED
    
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public DateTime? RegistrationStart { get; set; }
    public DateTime? RegistrationEnd { get; set; }
    
    public string? Organizer { get; set; }
    public string? ContactPerson { get; set; }
    public string? Notes { get; set; }
    
    public bool IsActive { get; set; } = true;

    // External Integration (e.g., HLĐT)
    public string? ExternalId { get; set; }
    public string? ExternalCode { get; set; }
    public string? SourceSystem { get; set; }

    public virtual ICollection<EventSession> Sessions { get; set; } = new List<EventSession>();
    public virtual ICollection<EventLocation> EventLocations { get; set; } = new List<EventLocation>();
    public virtual ICollection<EventDevice> EventDevices { get; set; } = new List<EventDevice>();
    public virtual ICollection<EventParticipant> Participants { get; set; } = new List<EventParticipant>();
}
