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
}

public class GetEmulationsQueryHandler : IRequestHandler<GetEmulationsQuery, List<EmulationDto>>
{
    private readonly IQLCDDbContext _context;

    public GetEmulationsQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<EmulationDto>> Handle(GetEmulationsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.ThiDuaCongDoans
            .Include(e => e.DoanVien)
            .Include(e => e.DonVi)
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
                    
                    // Lọc bản ghi cá nhân thuộc tổ quản lý hoặc bản ghi tập thể thuộc tổ quản lý
                    query = query.Where(e => 
                        (e.DonViId.HasValue && (e.DonViId == orgId || childOrgIds.Contains(e.DonViId.Value))) ||
                        (e.DoanVienId.HasValue && (e.DoanVien != null && (e.DoanVien.MaToCongDoan == orgId || childOrgIds.Contains(e.DoanVien.MaToCongDoan)))));
                }
                else // TOCD
                {
                    query = query.Where(e => 
                        (e.DonViId.HasValue && e.DonViId == orgId) ||
                        (e.DoanVienId.HasValue && e.DoanVien != null && e.DoanVien.MaToCongDoan == orgId));
                }
            }
            else
            {
                return new List<EmulationDto>();
            }
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
            .Select(e => new EmulationDto
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
                TenXepLoai = "",
                KhenThuong = e.KhenThuong,
                TrangThai = e.TrangThai
            })
            .ToListAsync(cancellationToken);

        foreach (var item in list)
        {
            if (catalogs.TryGetValue(item.XepLoai, out var name))
            {
                item.TenXepLoai = name;
            }
            else
            {
                item.TenXepLoai = item.XepLoai;
            }
        }

        return list;
    }
}
