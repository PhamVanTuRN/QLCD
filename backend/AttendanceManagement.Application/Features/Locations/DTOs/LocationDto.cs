using System;

namespace AttendanceManagement.Application.Features.Locations.DTOs;

public class LocationDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PhysicalLocation { get; set; }
    public int Capacity { get; set; }
    public bool IsActive { get; set; }
}
