using System;

namespace QLCD.Domain.Entities;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string EntityName { get; set; }
    public Guid RecordId { get; set; }
    public required string Action { get; set; } // INSERT, UPDATE, DELETE
    public string? OldValues { get; set; } // JSON string
    public string? NewValues { get; set; } // JSON string
    public string? UserId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
