using System;

namespace AttendanceManagement.Application.Features.Devices.DTOs;

public class DeviceDto
{
    public Guid Id { get; set; }
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string DeviceCode { get; set; } = string.Empty;
    public string DeviceName { get; set; } = string.Empty;
    public string DeviceType { get; set; } = string.Empty;
    public string? IPAddress { get; set; }
    public string? DeviceIdentifier { get; set; }
    public string? SerialNumber { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTime? LastOnlineAt { get; set; }
}
