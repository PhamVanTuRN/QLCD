using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class EvidenceFile : BaseEntity
{
    public required string OriginalFileName { get; set; }
    public required string StoredFileName { get; set; }
    public required string FileExtension { get; set; }
    public required string ContentType { get; set; }
    public long FileSize { get; set; }
    public required string StoragePath { get; set; }
    public required string ModuleName { get; set; } // "Activities", "Finance", "Welfare", "Initiatives", "Emulations", "Member"
    public Guid RelatedEntityId { get; set; } // ID of parent record (e.g. ActivityId)
    public Guid OrganizationId { get; set; } // For data scoping
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
