using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Initiatives.Queries.GetInitiatives;

public record GetInitiativesQuery : IRequest<List<InitiativeDto>>
{
    public string? Search { get; init; }
    public string? CapDeTai { get; init; }
    public int? TrangThai { get; init; }
    
    // Auth scope
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class InitiativeDto
{
    public Guid Id { get; set; }
    public Guid DoanVienId { get; set; }
    public string? HoTenDoanVien { get; set; }
    public string? MaNhanVien { get; set; }
    public Guid DonViId { get; set; }
    public string? TenDonVi { get; set; }
    public required string TenDeTai { get; set; }
    public required string LinhVuc { get; set; }
    public required string CapDeTai { get; set; }
    public string? TenCapDeTai { get; set; }
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    public int NamThucHien { get; set; }
    public string? KetQuaNghiemThu { get; set; }
    public int TrangThai { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public Guid? EvidenceFileId { get; set; }
    public string? EvidenceFileName { get; set; }
    public long? EvidenceFileSize { get; set; }
    public string? DownloadUrl { get; set; }
}

public class GetInitiativesQueryHandler : IRequestHandler<GetInitiativesQuery, List<InitiativeDto>>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetInitiativesQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<List<InitiativeDto>> Handle(GetInitiativesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SangKiens
            .Include(i => i.DoanVien)
            .Include(i => i.DonVi)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(i => allowedOrgIds.Contains(i.DonViId));
        }

        // 2. Lọc & Tìm kiếm
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(i => 
                i.TenDeTai.ToLower().Contains(search) || 
                i.DoanVien.HoTen.ToLower().Contains(search) || 
                i.DoanVien.MaNhanVien.ToLower().Contains(search) ||
                i.LinhVuc.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(request.CapDeTai))
        {
            query = query.Where(i => i.CapDeTai == request.CapDeTai);
        }

        if (request.TrangThai.HasValue)
        {
            query = query.Where(i => i.TrangThai == request.TrangThai.Value);
        }

        // 3. Tải danh mục cấp đề tài (LoaiSangKien)
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiSangKien")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var list = await query
            .OrderByDescending(i => i.NamThucHien)
            .Select(i => new
            {
                Initiative = i,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == i.Id && !f.IsDeleted)
                    .OrderByDescending(f => f.UploadedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var dtoList = new List<InitiativeDto>();
        foreach (var item in list)
        {
            var i = item.Initiative;
            var f = item.File;
            
            var dto = new InitiativeDto
            {
                Id = i.Id,
                DoanVienId = i.DoanVienId,
                HoTenDoanVien = i.DoanVien != null ? i.DoanVien.HoTen : "",
                MaNhanVien = i.DoanVien != null ? i.DoanVien.MaNhanVien : "",
                DonViId = i.DonViId,
                TenDonVi = i.DonVi != null ? i.DonVi.TenDonVi : "",
                TenDeTai = i.TenDeTai,
                LinhVuc = i.LinhVuc,
                CapDeTai = i.CapDeTai,
                TenCapDeTai = catalogs.TryGetValue(i.CapDeTai, out var name) ? name : i.CapDeTai,
                HieuQuaKinhTe = i.HieuQuaKinhTe,
                NgayNghiemThu = i.NgayNghiemThu,
                NamThucHien = i.NamThucHien,
                KetQuaNghiemThu = i.KetQuaNghiemThu,
                TrangThai = i.TrangThai,
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
