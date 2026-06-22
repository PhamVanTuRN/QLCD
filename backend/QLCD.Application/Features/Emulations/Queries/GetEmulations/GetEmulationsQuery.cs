using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Emulations.Queries.GetEmulations;

public record GetEmulationsQuery : IRequest<List<EmulationDto>>
{
    public string? Search { get; init; }
    public int? Nam { get; init; }
    public string? XepLoai { get; init; }
    
    // Auth scope
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
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
        var query = _context.ThiDuaCongDoans
            .Include(e => e.DoanVien)
            .Include(e => e.DonVi)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(e => 
                (e.DonViId.HasValue && allowedOrgIds.Contains(e.DonViId.Value)) ||
                (e.DoanVienId.HasValue && e.DoanVien != null && allowedOrgIds.Contains(e.DoanVien.MaToCongDoan)));
        }

        // 2. Lọc & Tìm kiếm
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(e => 
                e.TenPhongTrao.ToLower().Contains(search) || 
                (e.DoanVien != null && e.DoanVien.HoTen.ToLower().Contains(search)) || 
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
            .Select(e => new
            {
                Emulation = e,
                File = _context.EvidenceFiles
                    .Where(f => f.RelatedEntityId == e.Id && !f.IsDeleted)
                    .OrderByDescending(f => f.UploadedAt)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var dtoList = new List<EmulationDto>();
        foreach (var item in list)
        {
            var e = item.Emulation;
            var f = item.File;
            
            var dto = new EmulationDto
            {
                Id = e.Id,
                TenPhongTrao = e.TenPhongTrao,
                DoanVienId = e.DoanVienId,
                HoTenDoanVien = e.DoanVien != null ? e.DoanVien.HoTen : null,
                MaNhanVien = e.DoanVien != null ? e.DoanVien.MaNhanVien : null,
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
