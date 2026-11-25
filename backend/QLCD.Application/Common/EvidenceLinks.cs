using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Security;

namespace QLCD.Application.Common;

public sealed class EvidenceLinks(
    IQLCDDbContext database,
    ICurrentUserService currentUser,
    IOrganizationScopeService scope,
    TimeProvider clock)
{
    public const int PendingHours = 24;
    public static bool CanUse(string module, string? role) => module switch
    {
        "Finance" => role is SecurityRoles.Central or SecurityRoles.Department or SecurityRoles.Team,
        "Members" => role is SecurityRoles.Admin or SecurityRoles.Central or SecurityRoles.Department,
        "Activities" or "Welfare" or "Initiatives" or "Emulations" =>
            role is SecurityRoles.Central or SecurityRoles.Department or SecurityRoles.Team,
        _ => false
    };

    public async Task AttachAsync(string? reference, string module, Guid recordId, Guid organizationId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(reference))
            return;
        if (!Guid.TryParse(reference, out var fileId))
            throw new ArgumentException("Invalid evidence reference.");

        var file = await database.EvidenceFiles.FindAsync([fileId], cancellationToken);
        if (file is null || file.IsDeleted || file.ModuleName != module || file.OrganizationId != organizationId
            || !CanUse(module, currentUser.Role) || !await scope.IsInScopeAsync(organizationId, cancellationToken))
            throw new KeyNotFoundException("Evidence is not available.");

        if (file.RelatedEntityId == recordId)
            return;
        if (file.RelatedEntityId != Guid.Empty || currentUser.UserId is not Guid actor
            || file.UploadedByUserId != actor || IsExpired(file))
            throw new KeyNotFoundException("Evidence cannot be attached.");

        file.RelatedEntityId = recordId;
    }

    public async Task<bool> CanAccessAsync(EvidenceFile file, CancellationToken cancellationToken)
    {
        var role = currentUser.Role;
        if (!CanUse(file.ModuleName, role) || !await scope.IsInScopeAsync(file.OrganizationId, cancellationToken))
            return false;
        if (file.RelatedEntityId == Guid.Empty)
            return currentUser.UserId == file.UploadedByUserId && !IsExpired(file);

        var id = file.RelatedEntityId;
        var org = file.OrganizationId;
        return file.ModuleName switch
        {
            "Activities" => await database.HoatDongCongDoans.AnyAsync(x => x.Id == id && x.DonViId == org, cancellationToken),
            "Finance" => await database.TaiChinhCongDoans.AnyAsync(x => x.Id == id && x.DonViId == org
                && (role != SecurityRoles.Team || x.LoaiGiaoDich == "THU_DOAN_PHI"), cancellationToken),
            "Welfare" => await database.PhucLoiDoanViens.AnyAsync(x => x.Id == id && x.DonViId == org, cancellationToken),
            "Initiatives" => await database.SangKiens.AnyAsync(x => x.Id == id && x.DonViId == org, cancellationToken),
            "Emulations" => await database.ThiDuaCongDoans.AnyAsync(x => x.Id == id
                && (x.DonViId == org || (x.DonViId == null && x.DoanVien != null && x.DoanVien.MaToCongDoan == org)), cancellationToken),
            "Members" => await CanAccessTransferAsync(id, org, cancellationToken),
            _ => false
        };
    }

    private bool IsExpired(EvidenceFile file) =>
        file.UploadedAt < clock.GetUtcNow().UtcDateTime.AddHours(-PendingHours);

    private async Task<bool> CanAccessTransferAsync(Guid id, Guid org, CancellationToken cancellationToken)
    {
        var record = await database.LichSuBienDongs.AsNoTracking()
            .Where(x => x.Id == id && (x.TuToCongDoanId == org || x.DenToCongDoanId == org))
            .Select(x => new { x.TuToCongDoanId, x.DenToCongDoanId })
            .SingleOrDefaultAsync(cancellationToken);
        return record?.TuToCongDoanId is Guid source && record.DenToCongDoanId is Guid target
            && await scope.IsInScopeAsync(source, cancellationToken)
            && await scope.IsInScopeAsync(target, cancellationToken);
    }
}
