using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Activities.Queries.GetActivities;

public record GetActivitiesQuery : IRequest<List<ActivityDto>>
{
    public string? Search { get; init; }
    public string? LoaiHoatDong { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    
    // Auth context parameters
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class ActivityDto
{
    public Guid Id { get; set; }
    public Guid DonViId { get; set; }
    public string? TenDonVi { get; set; }
    public required string TenHoatDong { get; set; }
    public string? MoTa { get; set; }
    public required string LoaiHoatDong { get; set; }
    public string? TenLoaiHoatDong { get; set; }
    public DateTime TuNgay { get; set; }
    public DateTime DenNgay { get; set; }
    public required string DiaDiem { get; set; }
    public string? MaQRCode { get; set; }
    public decimal KinhPhi { get; set; }
    public string? KetQua { get; set; }
    public string? FileMinhChungUrl { get; set; }
}

public class GetActivitiesQueryHandler : IRequestHandler<GetActivitiesQuery, List<ActivityDto>>
{
    private readonly IQLCDDbContext _context;

    public GetActivitiesQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<ActivityDto>> Handle(GetActivitiesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.HoatDongCongDoans
            .Include(h => h.DonVi)
            .AsNoTracking();

        // 1. Áp dụng Phân quyền Phạm vi dữ liệu (Scope Filtering)
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                if (request.UserRole == "CDBP")
                {
                    // Được xem CĐBP và các tổ trực thuộc
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    query = query.Where(h => h.DonViId == orgId || childOrgIds.Contains(h.DonViId));
                }
                else // TOCD
                {
                    // Chỉ được xem tổ của mình
                    query = query.Where(h => h.DonViId == orgId);
                }
            }
            else
            {
                // Không có orgId mà không phải admin -> Trả về danh sách trống
                return new List<ActivityDto>();
            }
        }

        // 2. Tìm kiếm & Lọc
        if (!string.IsNullOrEmpty(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(h => h.TenHoatDong.ToLower().Contains(search) || h.DiaDiem.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(request.LoaiHoatDong))
        {
            query = query.Where(h => h.LoaiHoatDong == request.LoaiHoatDong);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(h => h.TuNgay >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(h => h.DenNgay <= request.ToDate.Value);
        }

        // 3. Tải danh mục loại hoạt động
        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiHoatDong")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var list = await query
            .OrderByDescending(h => h.TuNgay)
            .Select(h => new ActivityDto
            {
                Id = h.Id,
                DonViId = h.DonViId,
                TenDonVi = h.DonVi != null ? h.DonVi.TenDonVi : "",
                TenHoatDong = h.TenHoatDong,
                MoTa = h.MoTa,
                LoaiHoatDong = h.LoaiHoatDong,
                TenLoaiHoatDong = "", // Sẽ gán sau
                TuNgay = h.TuNgay,
                DenNgay = h.DenNgay,
                DiaDiem = h.DiaDiem,
                MaQRCode = h.MaQRCode,
                KinhPhi = h.KinhPhi,
                KetQua = h.KetQua,
                FileMinhChungUrl = h.FileMinhChungUrl
            })
            .ToListAsync(cancellationToken);

        foreach (var item in list)
        {
            if (catalogs.TryGetValue(item.LoaiHoatDong, out var name))
            {
                item.TenLoaiHoatDong = name;
            }
            else
            {
                item.TenLoaiHoatDong = item.LoaiHoatDong;
            }
        }

        return list;
    }
}
