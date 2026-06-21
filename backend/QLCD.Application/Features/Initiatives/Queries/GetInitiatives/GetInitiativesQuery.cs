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
}

public class GetInitiativesQueryHandler : IRequestHandler<GetInitiativesQuery, List<InitiativeDto>>
{
    private readonly IQLCDDbContext _context;

    public GetInitiativesQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<InitiativeDto>> Handle(GetInitiativesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.SangKiens
            .Include(i => i.DoanVien)
            .Include(i => i.DonVi)
            .AsNoTracking();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                if (request.UserRole == "CDBP")
                {
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    query = query.Where(i => i.DonViId == orgId || childOrgIds.Contains(i.DonViId));
                }
                else // TOCD
                {
                    query = query.Where(i => i.DonViId == orgId);
                }
            }
            else
            {
                return new List<InitiativeDto>();
            }
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
            .Select(i => new InitiativeDto
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
                TenCapDeTai = "",
                HieuQuaKinhTe = i.HieuQuaKinhTe,
                NgayNghiemThu = i.NgayNghiemThu,
                NamThucHien = i.NamThucHien,
                KetQuaNghiemThu = i.KetQuaNghiemThu,
                TrangThai = i.TrangThai
            })
            .ToListAsync(cancellationToken);

        foreach (var item in list)
        {
            if (catalogs.TryGetValue(item.CapDeTai, out var name))
            {
                item.TenCapDeTai = name;
            }
            else
            {
                item.TenCapDeTai = item.CapDeTai;
            }
        }

        return list;
    }
}
