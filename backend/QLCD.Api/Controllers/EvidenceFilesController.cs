using System.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using QLCD.Api.Security;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Security;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/evidence-files")]
[Authorize]
[EnableRateLimiting("evidence")]
public sealed class EvidenceFilesController(
    IQLCDDbContext database,
    IOrganizationScopeService scope,
    ICurrentUserService user,
    EvidenceLinks links,
    EvidenceStorage storage,
    TimeProvider clock) : ControllerBase
{
    private const long OrganizationQuota = 1024L * 1024 * 1024;

    [HttpPost("upload")]
    [RequestSizeLimit(EvidenceStorage.MaxRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = EvidenceStorage.MaxFileBytes)]
    public async Task<IActionResult> Upload(
        [FromForm] IFormFile file, [FromQuery] string moduleName, [FromQuery] Guid organizationId,
        CancellationToken cancellationToken)
    {
        if (file.Length is <= 0 or > EvidenceStorage.MaxFileBytes)
            throw new InvalidEvidenceException();
        if (!EvidenceLinks.CanUse(moduleName, user.Role) || user.UserId is not Guid actorId
            || !await scope.IsInScopeAsync(organizationId, cancellationToken))
            return Forbid();

        var name = Path.GetFileName(file.FileName.Replace('\\', '/'));
        if (name.Length > 250 || name.Any(char.IsControl)
            || !string.Equals(Path.GetExtension(name), ".pdf", StringComparison.OrdinalIgnoreCase))
            throw new InvalidEvidenceException();

        await using var transaction = database.Database.IsRelational()
            ? await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken)
            : null;
        var allocated = await database.EvidenceFiles.IgnoreQueryFilters().Where(value => value.OrganizationId == organizationId)
            .SumAsync(value => value.FileSize, cancellationToken);
        if (allocated > OrganizationQuota - file.Length)
            return StatusCode(413, new { success = false, message = "Kho minh chứng của đơn vị đã đầy." });

        var id = Guid.NewGuid();
        await storage.StoreAsync(id, file, cancellationToken);
        try
        {
            database.EvidenceFiles.Add(new EvidenceFile
            {
                Id = id,
                OriginalFileName = name,
                StoredFileName = id.ToString("N") + ".pdf",
                FileExtension = ".pdf",
                ContentType = "application/pdf",
                FileSize = file.Length,
                StoragePath = id.ToString("N"),
                ModuleName = moduleName,
                OrganizationId = organizationId,
                UploadedByUserId = actorId,
                UploadedAt = clock.GetUtcNow().UtcDateTime,
                ContentValidated = true
            });
            await database.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            storage.TryDelete(id);
            throw;
        }
        if (transaction is not null)
            await transaction.CommitAsync(cancellationToken);

        return Ok(new { success = true, data = new {
            id, originalFileName = name, downloadUrl = $"/api/v1/evidence-files/download/{id}"
        }});
    }

    [HttpGet("download/{id:guid}")]
    public async Task<IActionResult> Download(Guid id, CancellationToken cancellationToken)
    {
        var file = await database.EvidenceFiles.AsNoTracking().SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
        if (file is null || !await links.CanAccessAsync(file, cancellationToken))
            return NotFound();

        try
        {
            var stream = await storage.OpenAsync(file, cancellationToken);
            return stream is null ? NotFound() : File(stream, "application/octet-stream", file.OriginalFileName);
        }
        catch (InvalidEvidenceException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var file = await database.EvidenceFiles.SingleOrDefaultAsync(value => value.Id == id, cancellationToken);
        if (file is null || !await links.CanAccessAsync(file, cancellationToken))
            return NotFound();
        if (file.RelatedEntityId != Guid.Empty && user.Role is not (SecurityRoles.Admin or SecurityRoles.Central or SecurityRoles.Department))
            return Forbid();

        file.IsDeleted = true;
        file.UpdatedDate = clock.GetUtcNow().UtcDateTime;
        await database.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}
