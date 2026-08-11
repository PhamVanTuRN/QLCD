using System;

namespace AttendanceManagement.Application.Features.AttendanceLogs.DTOs;

public class AttendanceLogDto
{
    public Guid Id { get; set; }
    public Guid? EventId { get; set; }
    public Guid? DeviceId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    public DateTime AttendanceTime { get; set; }
    public string AttendanceMethod { get; set; } = string.Empty;
    public decimal? RecognitionScore { get; set; }
    public bool IsValid { get; set; }
    public string? ValidationMessage { get; set; }
    public string? RawPayload { get; set; }
}
