using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Queries.GetUnionMembers;

public record GetUnionMembersQuery : IRequest<GetUnionMembersResult>
{
    public string? Search { get; init; }
    public Guid? ToCongDoanId { get; init; }
    public VaiTroCongDoan? VaiTro { get; init; }
    public TrangThaiDoanVien? TrangThai { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 50;
}

public class UnionMemberDto
{
    public Guid Id { get; set; }
    public string HoTen { get; set; } = "";
    public string MaNhanVien { get; set; } = "";
    public string SoCCCD { get; set; } = "";
    public DateTime NgaySinh { get; set; }
    public int GioiTinh { get; set; }
    public string? ChucVu { get; set; }
    public string? DonViCongTac { get; set; }
    public string? ChucDanhChuyenMon { get; set; }
    public Guid MaToCongDoan { get; set; }
    public string TenToCongDoan { get; set; } = "";
    public VaiTroCongDoan VaiTro { get; set; }
    public TrangThaiDoanVien TrangThai { get; set; }
    public DateTime NgayVaoCongDoan { get; set; }
    public bool DangVien { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public string? TrinhDoHocVan { get; set; }
}

public class GetUnionMembersResult
{
    public List<UnionMemberDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

public class GetUnionMembersQueryHandler : IRequestHandler<GetUnionMembersQuery, GetUnionMembersResult>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetUnionMembersQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<GetUnionMembersResult> Handle(GetUnionMembersQuery request, CancellationToken cancellationToken)
    {
        var query = _context.DoanViens.AsQueryable();

        // 1. Phân quyền Phạm vi dữ liệu (Scope Filtering)
        var allowedOrgIds = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedOrgIds != null)
        {
            query = query.Where(d => allowedOrgIds.Contains(d.MaToCongDoan));
        }

        // Filter by search term
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.ToLower();
            query = query.Where(d =>
                d.HoTen.ToLower().Contains(search) ||
                d.MaNhanVien.ToLower().Contains(search) ||
                d.SoCCCD.Contains(search));
        }

        // Filter by Tổ Công đoàn
        if (request.ToCongDoanId.HasValue)
        {
            query = query.Where(d => d.MaToCongDoan == request.ToCongDoanId.Value);
        }

        // Filter by Vai trò
        if (request.VaiTro.HasValue)
        {
            query = query.Where(d => d.VaiTro == request.VaiTro.Value);
        }

        // Filter by Trạng thái
        if (request.TrangThai.HasValue)
        {
            query = query.Where(d => d.TrangThai == request.TrangThai.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(d => d.HoTen)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(d => new UnionMemberDto
            {
                Id = d.Id,
                HoTen = d.HoTen,
                MaNhanVien = d.MaNhanVien,
                SoCCCD = d.SoCCCD,
                NgaySinh = d.NgaySinh,
                GioiTinh = d.GioiTinh,
                ChucVu = d.ChucVu,
                DonViCongTac = d.DonViCongTac,
                ChucDanhChuyenMon = d.ChucDanhChuyenMon,
                MaToCongDoan = d.MaToCongDoan,
                TenToCongDoan = d.ToCongDoan != null ? d.ToCongDoan.TenDonVi : "",
                VaiTro = d.VaiTro,
                TrangThai = d.TrangThai,
                NgayVaoCongDoan = d.NgayVaoCongDoan,
                DangVien = d.DangVien,
                DienThoai = d.DienThoai,
                Email = d.Email,
                TrinhDoHocVan = d.TrinhDoHocVan
            })
            .ToListAsync(cancellationToken);

        return new GetUnionMembersResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}
