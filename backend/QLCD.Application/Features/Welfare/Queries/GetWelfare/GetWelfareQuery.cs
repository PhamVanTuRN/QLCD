using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Welfare.Queries.GetWelfare;

public record GetWelfareQuery : IRequest<List<WelfareDto>>
{
    public string? Search { get; init; }
    public string? LoaiPhucLoi { get; init; }
    public int? TrangThai { get; init; }
    
    // Auth scope
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class WelfareDto
{
    public Guid Id { get; set; }
    public Guid DoanVienId { get; set; }
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
}

public class GetWelfareQueryHandler : IRequestHandler<GetWelfareQuery, List<WelfareDto>>
{
    private readonly IQLCDDbContext _context;

    public GetWelfareQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<WelfareDto>> Handle(GetWelfareQuery request, CancellationToken cancellationToken)
    {
        var query = _context.PhucLoiDoanViens
            .Include(w => w.DoanVien)
            .Include(w => w.DonVi)
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
                    
                    query = query.Where(w => w.DonViId == orgId || childOrgIds.Contains(w.DonViId));
                }
                else // TOCD
                {
                    query = query.Where(w => w.DonViId == orgId);
                }
            }
            else
            {
                return new List<WelfareDto>();
            }
        }

        // 2. Lọc & Tìm kiếm
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(w => 
                w.DoanVien.HoTen.ToLower().Contains(search) || 
                w.DoanVien.MaNhanVien.ToLower().Contains(search) ||
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
            .Select(w => new WelfareDto
            {
                Id = w.Id,
                DoanVienId = w.DoanVienId,
                HoTenDoanVien = w.DoanVien != null ? w.DoanVien.HoTen : "",
                MaNhanVien = w.DoanVien != null ? w.DoanVien.MaNhanVien : "",
                DonViId = w.DonViId,
                TenDonVi = w.DonVi != null ? w.DonVi.TenDonVi : "",
                LoaiPhucLoi = w.LoaiPhucLoi,
                TenLoaiPhucLoi = "",
                KinhPhiHoTro = w.KinhPhiHoTro,
                NgayHoTro = w.NgayHoTro,
                LyDo = w.LyDo,
                TrangThai = w.TrangThai,
                FileMinhChungUrl = w.FileMinhChungUrl
            })
            .ToListAsync(cancellationToken);

        foreach (var item in list)
        {
            if (catalogs.TryGetValue(item.LoaiPhucLoi, out var name))
            {
                item.TenLoaiPhucLoi = name;
            }
            else
            {
                item.TenLoaiPhucLoi = item.LoaiPhucLoi;
            }
        }

        return list;
    }
}
