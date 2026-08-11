using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class AttendanceDevice : BaseEntity
{
    public Guid LocationId { get; set; }
    
    public required string DeviceCode { get; set; }
    public required string DeviceName { get; set; }
    public required string DeviceType { get; set; } // CAMERA, FACE_RECOGNITION, QR_SCANNER, CARD_READER, MANUAL, OTHER
    
    public string? IPAddress { get; set; }
    public string? DeviceIdentifier { get; set; }
    public string? SerialNumber { get; set; }
    
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastOnlineAt { get; set; }
    
    // For external integration mapping
    public Guid? SourceSystemId { get; set; }

    public virtual Location Location { get; set; } = null!;
    public virtual AttendanceSource? SourceSystem { get; set; }
}
