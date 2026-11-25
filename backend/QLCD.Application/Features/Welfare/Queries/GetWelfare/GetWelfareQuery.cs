using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Welfare.Queries.GetWelfare;

public record GetWelfareQuery : IRequest<List<WelfareDto>>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageBounds.DefaultSize;
    public string? Search { get; init; }
    public string? LoaiPhucLoi { get; init; }
    public int? TrangThai { get; init; }
    
    // Auth scope
}

public class WelfareDto
{
    public Guid Id { get; set; }
    public Guid? DoanVienId { get; set; }
    public string? HoTenDoanVien { get; set; }
    public string? MaNhanVien { get; set; }
    public Guid DonViId { get; set; }
    public string? TenDonVi { get; set; }
    public required string LoaiPhucLoi { get; set; }
    public string? TenLoaiPhucLoi { get; set; }
    public decimal KinhPhiHoTro { get; set; }
    public DateTime NgayHoTro { get; set; }
    public required string LyDo { get; set; }
    public int TrangThai { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public Guid? EvidenceFileId { get; set; }
    public string? EvidenceFileName { get; set; }
    public long? EvidenceFileSize { get; set; }
    public string? DownloadUrl { get; set; }
}

public class GetWelfareQueryHandler : IRequestHandler<GetWelfareQuery, List<WelfareDto>>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetWelfareQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<List<WelfareDto>> Handle(GetWelfareQuery request, CancellationToken cancellationToken)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var query = _context.PhucLoiDoanViens
            .Include(w => w.DoanVien)
            .Include(w => w.DonVi)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(w => allowedOrgIds.Contains(w.DonViId));
        }

        // 2. Lọc & Tìm kiếm
        var search = PageBounds.Search(request.Search);
        if (search is not null)
        {
            query = query.Where(w => 
                (w.DoanVien != null && w.DoanVien.MaToCongDoan == w.DonViId && w.DoanVien.HoTen.ToLower().Contains(search)) ||
                (w.DoanVien != null && w.DoanVien.MaToCongDoan == w.DonViId && w.DoanVien.MaNhanVien.ToLower().Contains(search)) ||
                w.LyDo.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(request.LoaiPhucLoi))
        {
            query = query.Where(w => w.LoaiPhucLoi == request.LoaiPhucLoi);
        }

        if (request.TrangThai.HasValue)
        {
            query = query.Where(w => w.TrangThai == request.TrangThai.Value);
        }

        // 3. Tải danh mục loại phúc lợi (HinhThucPhucLoi)
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "HinhThucPhucLoi")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var list = await query
            .OrderByDescending(w => w.NgayHoTro)
            .ThenBy(w => w.Id)
            .Skip(offset).Take(request.PageSize + 1)
            .Select(w => new
            {
                Welfare = w,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == w.Id && f.ModuleName == "Welfare" && f.OrganizationId == w.DonViId && !f.IsDeleted)
                    .OrderByDescending(f => f.UploadedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var dtoList = new List<WelfareDto>();
        foreach (var item in list)
        {
            var w = item.Welfare;
            var f = item.File;

            var dto = new WelfareDto
            {
                Id = w.Id,
                DoanVienId = w.DoanVien != null && w.DoanVien.MaToCongDoan == w.DonViId ? w.DoanVienId : null,
                HoTenDoanVien = w.DoanVien != null && w.DoanVien.MaToCongDoan == w.DonViId ? w.DoanVien.HoTen : "",
                MaNhanVien = w.DoanVien != null && w.DoanVien.MaToCongDoan == w.DonViId ? w.DoanVien.MaNhanVien : "",
                DonViId = w.DonViId,
                TenDonVi = w.DonVi != null ? w.DonVi.TenDonVi : "",
                LoaiPhucLoi = w.LoaiPhucLoi,
                TenLoaiPhucLoi = catalogs.TryGetValue(w.LoaiPhucLoi, out var name) ? name : w.LoaiPhucLoi,
                KinhPhiHoTro = w.KinhPhiHoTro,
                NgayHoTro = w.NgayHoTro,
                LyDo = w.LyDo,
                TrangThai = w.TrangThai,
                FileMinhChungUrl = w.FileMinhChungUrl,
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
