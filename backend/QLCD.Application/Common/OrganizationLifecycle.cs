using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Domain.Security;

namespace QLCD.Application.Common;

public static class OrganizationAccess
{
    // The supported hierarchy has at most three levels. Every ancestor must be live.
    public static IQueryable<DonViCongDoan> OperationalUnits(this IQueryable<DonViCongDoan> units) =>
        units.Where(u => !u.IsDeleted && u.TrangThai == 1 && (u.MaParent == null
            || units.Any(p => p.Id == u.MaParent && !p.IsDeleted && p.TrangThai == 1 && (p.MaParent == null
                || units.Any(g => g.Id == p.MaParent && !g.IsDeleted && g.TrangThai == 1 && g.MaParent == null)))));
}

public sealed class OrganizationStateException(string message) : ArgumentException(message);

public static class OrganizationLifecycle
{
    public static void RequireManager(ICurrentUserService user)
    {
        if (user.UserId is null || user.Role is not (SecurityRoles.Admin or SecurityRoles.Central))
            throw new UnauthorizedAccessException("Không có quyền quản lý trạng thái đơn vị.");
    }

    public static async Task<bool> ChangeAsync(IQLCDDbContext db, ICurrentUserService user, Guid id, bool restore, CancellationToken ct)
    {
        RequireManager(user);
        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct) : null;
        var unit = await db.DonViCongDoans.IgnoreQueryFilters().SingleOrDefaultAsync(u => u.Id == id, ct)
            ?? throw new KeyNotFoundException("Đơn vị không tồn tại.");
        if (!restore)
        {
            if (unit.LoaiToChuc == LoaiToChuc.CDCS)
                throw new OrganizationStateException("Không được ngừng hoạt động Công đoàn cơ sở tại đây.");
            if (await db.DonViCongDoans.IgnoreQueryFilters().AnyAsync(u => u.MaParent == id, ct))
                throw new OrganizationStateException("Đơn vị còn đơn vị con, kể cả con đã ngừng hoạt động. Không tự động thay đổi đơn vị con.");
            if (unit.IsDeleted || unit.TrangThai == 0) return true;
            unit.TrangThai = 0;

        }
        else
        {
            if (unit.MaParent is Guid parent && !await db.DonViCongDoans.OperationalUnits().AnyAsync(u => u.Id == parent, ct))
                throw new OrganizationStateException("Khôi phục đơn vị cha trước khi khôi phục đơn vị này.");
            if (unit.LoaiToChuc == LoaiToChuc.CDCS && await db.DonViCongDoans.OperationalUnits().AnyAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS && u.Id != id, ct))
                throw new OrganizationStateException("Đã có Công đoàn cơ sở đang hoạt động.");
            if (!unit.IsDeleted && unit.TrangThai == 1) return true;
            unit.IsDeleted = false; // Explicitly restore an old soft-deleted record, preserving its ID/FKs.
            unit.TrangThai = 1;
        }
        // Invalidate sessions, not account state. Old data can contain descendants below an inactive parent.
        var children = await db.DonViCongDoans.IgnoreQueryFilters().Where(u => u.MaParent == id).Select(u => u.Id).ToListAsync(ct);
        var grandchildren = await db.DonViCongDoans.IgnoreQueryFilters().Where(u => u.MaParent != null && children.Contains(u.MaParent.Value)).Select(u => u.Id).ToListAsync(ct);
        var affected = children.Concat(grandchildren).Append(id).ToArray();
        foreach (var account in await db.TaiKhoans.IgnoreQueryFilters().Where(a => a.OrganizationId != null && affected.Contains(a.OrganizationId.Value)).ToListAsync(ct))
            account.SecurityVersion = Guid.NewGuid();
        db.AuditLogs.Add(new AuditLog { EntityName = nameof(DonViCongDoan), RecordId = id,
            Action = restore ? "ORG_RESTORE" : "ORG_DEACTIVATE", UserId = user.UserId!.Value.ToString() });
        await db.SaveChangesAsync(ct);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return true;
    }
}

public sealed record RestoreUnionUnitCommand(Guid Id) : IRequest<bool>;
public sealed class RestoreUnionUnitCommandHandler(IQLCDDbContext db, ICurrentUserService user) : IRequestHandler<RestoreUnionUnitCommand, bool>
{
    public Task<bool> Handle(RestoreUnionUnitCommand request, CancellationToken ct) => OrganizationLifecycle.ChangeAsync(db, user, request.Id, true, ct);
}

public sealed record GetInactiveUnitsQuery(int Page = 1, int PageSize = PageBounds.DefaultSize) : IRequest<List<InactiveUnitDto>>;
public sealed record InactiveUnitDto(Guid Id, string TenDonVi, Guid? MaParent, string? ParentName, bool LegacyDeleted, bool CanRestore);
public sealed class GetInactiveUnitsQueryHandler(IQLCDDbContext db, ICurrentUserService user) : IRequestHandler<GetInactiveUnitsQuery, List<InactiveUnitDto>>
{
    public Task<List<InactiveUnitDto>> Handle(GetInactiveUnitsQuery request, CancellationToken ct)
    {
        OrganizationLifecycle.RequireManager(user);
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var operational = db.DonViCongDoans.OperationalUnits();
        return db.DonViCongDoans.IgnoreQueryFilters().AsNoTracking()
            .Where(u => !operational.Any(active => active.Id == u.Id))
            .OrderBy(u => u.TenDonVi).ThenBy(u => u.Id).Skip(offset).Take(request.PageSize + 1)
            .Select(u => new InactiveUnitDto(u.Id, u.TenDonVi, u.MaParent,
                db.DonViCongDoans.IgnoreQueryFilters().Where(p => p.Id == u.MaParent).Select(p => p.TenDonVi).FirstOrDefault(), u.IsDeleted,
                u.MaParent == null || operational.Any(p => p.Id == u.MaParent)))
            .ToListAsync(ct);
    }
}
