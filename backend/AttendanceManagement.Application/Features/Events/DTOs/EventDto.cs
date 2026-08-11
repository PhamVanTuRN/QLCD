using System;
using System.Collections.Generic;

namespace AttendanceManagement.Application.Features.Events.DTOs;

public class EventDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? EventType { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? Organizer { get; set; }
    public string? ContactPerson { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedDate { get; set; }
    public string? CreatedBy { get; set; }

    public List<EventSessionDto> Sessions { get; set; } = new();
    public List<Guid> LocationIds { get; set; } = new();
    public List<Guid> DeviceIds { get; set; } = new();
    public ParticipantConfigDto ParticipantConfig { get; set; } = new() { ParticipantType = "NO_PREDEFINED_LIST" };
}

public class EventSessionDto
{
    public string SessionName { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public int DisplayOrder { get; set; }
    public List<AttendanceRuleDto> Rules { get; set; } = new();
}

public class AttendanceRuleDto
{
    public string AttendanceType { get; set; } = string.Empty;
    public TimeSpan WindowStart { get; set; }
    public TimeSpan ReferenceTime { get; set; }
    public TimeSpan WindowEnd { get; set; }
    public bool Required { get; set; }
}

public class ParticipantConfigDto
{
    public string ParticipantType { get; set; } = string.Empty;
    public List<Guid> DepartmentIds { get; set; } = new();
    public List<Guid> PersonIds { get; set; } = new();
}
