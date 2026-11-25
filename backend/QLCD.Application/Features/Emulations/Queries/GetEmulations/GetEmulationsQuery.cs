using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Emulations.Queries.GetEmulations;

public record GetEmulationsQuery : IRequest<List<EmulationDto>>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageBounds.DefaultSize;
    public string? Search { get; init; }
    public int? Nam { get; init; }
    public string? XepLoai { get; init; }
    
    // Auth scope
}

public class EmulationDto
{
    public Guid Id { get; set; }
    public required string TenPhongTrao { get; set; }
    public Guid? DoanVienId { get; set; }
    public string? HoTenDoanVien { get; set; }
    public string? MaNhanVien { get; set; }
    public Guid? DonViId { get; set; }
    public string? TenDonVi { get; set; }
    public int Nam { get; set; }
    public decimal DiemTuDanhGia { get; set; }
    public decimal DiemBchDuyet { get; set; }
    public required string XepLoai { get; set; }
    public string? TenXepLoai { get; set; }
    public string? KhenThuong { get; set; }
    public int TrangThai { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public Guid? EvidenceFileId { get; set; }
    public string? EvidenceFileName { get; set; }
    public long? EvidenceFileSize { get; set; }
    public string? DownloadUrl { get; set; }
}

public class GetEmulationsQueryHandler : IRequestHandler<GetEmulationsQuery, List<EmulationDto>>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetEmulationsQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<List<EmulationDto>> Handle(GetEmulationsQuery request, CancellationToken cancellationToken)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var query = _context.ThiDuaCongDoans
            .Include(e => e.DoanVien)
            .Include(e => e.DonVi)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        query = EmulationScope.Apply(query, allowedOrgIds);

        // 2. Lọc & Tìm kiếm
        var search = PageBounds.Search(request.Search);
        if (search is not null)
        {
            query = query.Where(e => 
                e.TenPhongTrao.ToLower().Contains(search) || 
                (e.DoanVien != null && (e.DonViId == null || e.DonViId == e.DoanVien.MaToCongDoan) && e.DoanVien.HoTen.ToLower().Contains(search)) ||
                (e.DonVi != null && e.DonVi.TenDonVi.ToLower().Contains(search)));
        }

        if (request.Nam.HasValue)
        {
            query = query.Where(e => e.Nam == request.Nam.Value);
        }

        if (!string.IsNullOrEmpty(request.XepLoai))
        {
            query = query.Where(e => e.XepLoai == request.XepLoai);
        }

        // 3. Tải danh mục xếp loại (ChatLuongDoanVien)
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "ChatLuongDoanVien")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var list = await query
            .OrderByDescending(e => e.Nam)
            .ThenBy(e => e.Id)
            .Skip(offset).Take(request.PageSize + 1)
            .Select(e => new
            {
                Emulation = e,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == e.Id && f.ModuleName == "Emulations" && f.OrganizationId == (e.DonViId ?? (e.DoanVien != null ? e.DoanVien.MaToCongDoan : (Guid?)null)) && !f.IsDeleted)
                    .OrderByDescending(f => f.UploadedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var dtoList = new List<EmulationDto>();
        foreach (var item in list)
        {
            var e = item.Emulation;
            var f = item.File;
            var visibleMember = e.DoanVien != null && (e.DonViId == null || e.DonViId == e.DoanVien.MaToCongDoan)
                ? e.DoanVien : null;

            var dto = new EmulationDto
            {
                Id = e.Id,
                TenPhongTrao = e.TenPhongTrao,
                DoanVienId = visibleMember?.Id,
                HoTenDoanVien = visibleMember?.HoTen,
                MaNhanVien = visibleMember?.MaNhanVien,
                DonViId = e.DonViId,
                TenDonVi = e.DonVi != null ? e.DonVi.TenDonVi : (e.DoanVien != null && e.DoanVien.ToCongDoan != null ? e.DoanVien.ToCongDoan.TenDonVi : ""),
                Nam = e.Nam,
                DiemTuDanhGia = e.DiemTuDanhGia,
                DiemBchDuyet = e.DiemBchDuyet,
                XepLoai = e.XepLoai,
                TenXepLoai = catalogs.TryGetValue(e.XepLoai, out var name) ? name : e.XepLoai,
                KhenThuong = e.KhenThuong,
                TrangThai = e.TrangThai,
                FileMinhChungUrl = f != null ? f.Id.ToString() : null,
                EvidenceFileId = f?.Id,
                EvidenceFileName = f?.OriginalFileName,
                EvidenceFileSize = f?.FileSize,
                DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
            };
            dtoList.Add(dto);
        }

        return dtoList;
    }
}

internal static class EmulationScope
{
    public static IQueryable<ThiDuaCongDoan> Apply(IQueryable<ThiDuaCongDoan> query, IReadOnlyCollection<Guid>? allowed)
        => allowed is null ? query : query.Where(e =>
            (e.DonViId.HasValue && allowed.Contains(e.DonViId.Value)) ||
            (!e.DonViId.HasValue && e.DoanVien != null && allowed.Contains(e.DoanVien.MaToCongDoan)));
}
