using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Finance.Queries.GetFinance;

public record GetFinanceQuery : IRequest<List<FinanceDto>>
{
    public string? Search { get; init; }
    public string? LoaiGiaoDich { get; init; }
    public string? ThangNam { get; init; }
    
    // Auth scope parameters
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

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

public class GetFinanceQueryHandler : IRequestHandler<GetFinanceQuery, List<FinanceDto>>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetFinanceQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<List<FinanceDto>> Handle(GetFinanceQuery request, CancellationToken cancellationToken)
    {
        var query = _context.TaiChinhCongDoans
            .Include(t => t.DonVi)
            .Include(t => t.DoanVien)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(t => allowedOrgIds.Contains(t.DonViId));
        }

        // 2. Tìm kiếm & Lọc
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(t => 
                t.NguoiGiaoDich.ToLower().Contains(search) || 
                (t.GhiChu != null && t.GhiChu.ToLower().Contains(search)) ||
                (t.DoanVien != null && t.DoanVien.HoTen.ToLower().Contains(search)));
        }

        if (!string.IsNullOrEmpty(request.LoaiGiaoDich))
        {
            query = query.Where(t => t.LoaiGiaoDich == request.LoaiGiaoDich);
        }

        if (!string.IsNullOrEmpty(request.ThangNam))
        {
            query = query.Where(t => t.ThangNam == request.ThangNam);
        }

        // 3. Tải danh mục loại giao dịch (LoaiThuChi)
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiThuChi" || c.Loai == "LoaiDoanPhi")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var list = await query
            .OrderByDescending(t => t.NgayGiaoDich)
            .Select(t => new
            {
                Finance = t,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == t.Id && !f.IsDeleted)
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
                TenLoaiGiaoDich = catalogs.TryGetValue(t.LoaiGiaoDich, out var name) ? name : t.LoaiGiaoDich,
                SoTien = t.SoTien,
                NgayGiaoDich = t.NgayGiaoDich,
                NguoiGiaoDich = t.NguoiGiaoDich,
                DoanVienId = t.DoanVienId,
                HoTenDoanVien = t.DoanVien != null ? t.DoanVien.HoTen : null,
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

        return dtoList;
    }
}
