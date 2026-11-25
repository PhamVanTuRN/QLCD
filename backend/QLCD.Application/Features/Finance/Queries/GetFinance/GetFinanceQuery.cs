using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Security;

namespace QLCD.Application.Features.Finance.Queries.GetFinance;

public record GetFinanceQuery : IRequest<FinancePage>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageBounds.DefaultSize;
    public string? Search { get; init; }
    public string? LoaiGiaoDich { get; init; }
    public string? ThangNam { get; init; }
    
    // Auth scope parameters
}

public sealed record FinancePage(List<FinanceDto> Items, FinanceTotals Totals);
public sealed record FinanceTotals(decimal Receipt, decimal Expense);

public class FinanceDto
{
    public Guid Id { get; set; }
    public Guid DonViId { get; set; }
    public string? TenDonVi { get; set; }
    public required string LoaiGiaoDich { get; set; }
    public string? TenLoaiGiaoDich { get; set; }
    public decimal SoTien { get; set; }
    public DateTime NgayGiaoDich { get; set; }
    public required string NguoiGiaoDich { get; set; }
    public Guid? DoanVienId { get; set; }
    public string? HoTenDoanVien { get; set; }
    public string? ThangNam { get; set; }
    public string? GhiChu { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public Guid? EvidenceFileId { get; set; }
    public string? EvidenceFileName { get; set; }
    public long? EvidenceFileSize { get; set; }
    public string? DownloadUrl { get; set; }
}

public class GetFinanceQueryHandler : IRequestHandler<GetFinanceQuery, FinancePage>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUser;

    public GetFinanceQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUser = currentUser;
    }

    public async Task<FinancePage> Handle(GetFinanceQuery request, CancellationToken cancellationToken)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var query = _context.TaiChinhCongDoans
            .Include(t => t.DonVi)
            .Include(t => t.DoanVien)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        query = _currentUser.Role switch
        {
            SecurityRoles.Central or SecurityRoles.Department => query,
            SecurityRoles.Team => query.Where(value => value.LoaiGiaoDich == "THU_DOAN_PHI"),
            _ => query.Where(_ => false)
        };

        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(t => allowedOrgIds.Contains(t.DonViId));
        }

        // 2. Tìm kiếm & Lọc
        var search = PageBounds.Search(request.Search);
        if (search is not null)
        {
            query = query.Where(t => 
                t.NguoiGiaoDich.ToLower().Contains(search) || 
                (t.GhiChu != null && t.GhiChu.ToLower().Contains(search)) ||
                (t.DoanVien != null && t.DoanVien.MaToCongDoan == t.DonViId && t.DoanVien.HoTen.ToLower().Contains(search)));
        }

        if (!string.IsNullOrEmpty(request.LoaiGiaoDich))
        {
            query = query.Where(t => t.LoaiGiaoDich == request.LoaiGiaoDich);
        }

        if (!string.IsNullOrEmpty(request.ThangNam))
        {
            query = query.Where(t => t.ThangNam == request.ThangNam);
        }

        var totals = await query.GroupBy(_ => 1)
            .Select(group => new FinanceTotals(
                group.Sum(row => row.LoaiGiaoDich.StartsWith("THU_") ? row.SoTien : 0),
                group.Sum(row => row.LoaiGiaoDich.StartsWith("CHI_") ? row.SoTien : 0)))
            .SingleOrDefaultAsync(cancellationToken) ?? new FinanceTotals(0, 0);

        // LoaiThuChi takes precedence when a legacy LoaiDoanPhi row has the same code.
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiThuChi" || c.Loai == "LoaiDoanPhi")
            .Select(c => new { c.Loai, c.Ma, c.Ten })
            .ToListAsync(cancellationToken);
        var labels = catalogs.GroupBy(c => c.Ma)
            .ToDictionary(group => group.Key, group => group.OrderByDescending(c => c.Loai == "LoaiThuChi").First().Ten);

        var list = await query
            .OrderByDescending(t => t.NgayGiaoDich)
            .ThenBy(t => t.Id)
            .Skip(offset).Take(request.PageSize + 1)
            .Select(t => new
            {
                Finance = t,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == t.Id && f.ModuleName == "Finance" && f.OrganizationId == t.DonViId && !f.IsDeleted)
                    .OrderByDescending(f => f.UploadedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var dtoList = new List<FinanceDto>();
        foreach (var item in list)
        {
            var t = item.Finance;
            var f = item.File;

            var dto = new FinanceDto
            {
                Id = t.Id,
                DonViId = t.DonViId,
                TenDonVi = t.DonVi != null ? t.DonVi.TenDonVi : "",
                LoaiGiaoDich = t.LoaiGiaoDich,
                TenLoaiGiaoDich = labels.GetValueOrDefault(t.LoaiGiaoDich, t.LoaiGiaoDich),
                SoTien = t.SoTien,
                NgayGiaoDich = t.NgayGiaoDich,
                NguoiGiaoDich = t.NguoiGiaoDich,
                DoanVienId = t.DoanVien != null && t.DoanVien.MaToCongDoan == t.DonViId ? t.DoanVienId : null,
                HoTenDoanVien = t.DoanVien != null && t.DoanVien.MaToCongDoan == t.DonViId ? t.DoanVien.HoTen : null,
                ThangNam = t.ThangNam,
                GhiChu = t.GhiChu,
                FileMinhChungUrl = f != null ? f.Id.ToString() : null,
                EvidenceFileId = f?.Id,
                EvidenceFileName = f?.OriginalFileName,
                EvidenceFileSize = f?.FileSize,
                DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
            };
            dtoList.Add(dto);
        }

        return new FinancePage(dtoList, totals);
    }
}
