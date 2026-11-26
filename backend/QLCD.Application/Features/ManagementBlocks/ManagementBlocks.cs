using System.ComponentModel.DataAnnotations;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.ManagementBlocks;

public sealed record ManagementBlockDto(Guid Id, string TenKhoi, string? GhiChu, bool TrangThai, bool LegacyDeleted, int? UnitCount);
public sealed record GetManagementBlocks(int Page = 1, int PageSize = PageBounds.DefaultSize, bool ActiveOnly = false, string? Search = null) : IRequest<List<ManagementBlockDto>>;
public sealed class GetManagementBlocksHandler(IQLCDDbContext db, ICurrentUserService user) : IRequestHandler<GetManagementBlocks, List<ManagementBlockDto>>
{
    public Task<List<ManagementBlockDto>> Handle(GetManagementBlocks request, CancellationToken ct)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var rows = db.KhoiChuyenMons.IgnoreQueryFilters().AsNoTracking();
        if (request.ActiveOnly) rows = rows.Where(b => b.TrangThai && !b.IsDeleted);
        var search = PageBounds.Search(request.Search);
        if (search is not null) rows = rows.Where(b => b.TenKhoi.ToLower().Contains(search));
        return rows.OrderBy(b => b.TenKhoi).ThenBy(b => b.Id).Skip(offset).Take(request.PageSize + 1)
            .Select(b => new ManagementBlockDto(b.Id, b.TenKhoi, b.GhiChu, b.TrangThai, b.IsDeleted,
                user.Role == "ADMIN" ? db.DonViCongDoans.IgnoreQueryFilters().Count(u => u.MaKhoi == b.Id) : (int?)null)).ToListAsync(ct);
    }
}

public sealed record SaveManagementBlock : IRequest<Guid>
{
    public Guid? Id { get; init; }
    [Required, StringLength(100)] public required string TenKhoi { get; init; }
    [StringLength(500)] public string? GhiChu { get; init; }
    public bool TrangThai { get; init; } = true;
    public bool Confirmed { get; init; }
}
public sealed class SaveManagementBlockHandler(IQLCDDbContext db, ICurrentUserService user) : IRequestHandler<SaveManagementBlock, Guid>
{
    public async Task<Guid> Handle(SaveManagementBlock request, CancellationToken ct)
    {
        if (user.UserId is null || user.Role != "ADMIN") throw new UnauthorizedAccessException();
        var name = request.TenKhoi.Trim();
        if (name.Length is < 1 or > 100 || request.GhiChu?.Length > 500) throw new ArgumentException("Thông tin khối không hợp lệ.");
        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, ct) : null;
        if (await db.KhoiChuyenMons.IgnoreQueryFilters().AnyAsync(b => b.Id != request.Id && b.TenKhoi.ToUpper() == name.ToUpper(), ct))
            throw new OrganizationStateException("Tên khối đã tồn tại, kể cả khối ngừng sử dụng. Hãy chỉnh sửa khối hiện có.");
        var block = request.Id is Guid id
            ? await db.KhoiChuyenMons.IgnoreQueryFilters().SingleOrDefaultAsync(b => b.Id == id, ct) ?? throw new KeyNotFoundException()
            : new KhoiChuyenMon { TenKhoi = name };
        if (request.Id is not null && block.TrangThai && !request.TrangThai && !request.Confirmed)
            throw new OrganizationStateException("Hãy xác nhận ngừng sử dụng khối. Các liên kết đơn vị được giữ nguyên.");
        if (request.Id is null) db.KhoiChuyenMons.Add(block);
        block.TenKhoi = name; block.GhiChu = request.GhiChu; block.TrangThai = request.TrangThai;
        block.IsDeleted = false; // Explicit admin editing can recover a legacy catalog row; no relation changes.
        db.AuditLogs.Add(new AuditLog { EntityName = nameof(KhoiChuyenMon), RecordId = block.Id,
            Action = request.Id is null ? "BLOCK_CREATE" : "BLOCK_UPDATE", UserId = user.UserId.ToString() });
        await db.SaveChangesAsync(ct);
        if (transaction is not null) await transaction.CommitAsync(ct);
        return block.Id;
    }
}

public static class ManagementBlockAssignment
{
    public static async Task ValidateAsync(IQLCDDbContext db, Guid? requested, Guid? current, bool creating, CancellationToken ct)
    {
        if (!creating && requested == current) return; // Preserve unclassified and stopped legacy assignments.
        if (requested is null || requested == Guid.Empty)
            throw new OrganizationStateException("Đơn vị mới hoặc thay đổi phân loại phải chọn Khối quản lý đang sử dụng.");
        if (!await db.KhoiChuyenMons.AnyAsync(b => b.Id == requested && b.TrangThai, ct))
            throw new OrganizationStateException("Khối quản lý không tồn tại hoặc đã ngừng sử dụng.");
    }
}
