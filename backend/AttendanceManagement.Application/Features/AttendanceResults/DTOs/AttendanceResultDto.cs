using System;

namespace AttendanceManagement.Application.Features.AttendanceResults.DTOs;

public class AttendanceResultDto
{
    public Guid Id { get; set; }
    public Guid EventId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    public DateTime? FirstAttendanceTime { get; set; }
    public DateTime? LastAttendanceTime { get; set; }
    public int TotalLogs { get; set; }
    public int ValidLogs { get; set; }
    public int CompletedRequiredWindows { get; set; }
    public int RequiredWindows { get; set; }
    public string AttendanceStatus { get; set; } = string.Empty;
    public string? ResultReason { get; set; }
    public DateTime CalculatedAt { get; set; }
    public bool IsManualOverride { get; set; }
    public string? ManualOverrideReason { get; set; }
}
