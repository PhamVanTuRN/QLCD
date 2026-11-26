using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Enums;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;

public record GetUnionUnitsTreeQuery : IRequest<UnionUnitDto?>;

public class UnionUnitDto
{
    public Guid Id { get; set; }
    public required string TenDonVi { get; set; }
    public LoaiToChuc LoaiToChuc { get; set; }
    public int Level { get; set; }
    public Guid? MaParent { get; set; }
    public Guid? MaKhoi { get; set; }
    public string? TenKhoi { get; set; }
    public bool KhoiDangSuDung { get; set; }
    public int TrangThai { get; set; }
    public bool CoTheTiepNhanDoanVien { get; set; }
    public int SoDoanVien { get; set; }
    
    // Thống kê chi tiết
    public int SoDoanVienNam { get; set; }
    public int SoDoanVienNu { get; set; }
    public int SoDoanVienDangVien { get; set; }
    public int SoTrinhDoDaiHoc { get; set; }
    public int SoCoNgoaiNgu { get; set; }

    public List<UnionUnitDto> Children { get; set; } = new();
}

public class UnitStats
{
    public int SoDoanVien { get; set; }
    public int SoDoanVienNam { get; set; }
    public int SoDoanVienNu { get; set; }
    public int SoDoanVienDangVien { get; set; }
    public int SoTrinhDoDaiHoc { get; set; }
    public int SoCoNgoaiNgu { get; set; }
}

public class GetUnionUnitsTreeQueryHandler : IRequestHandler<GetUnionUnitsTreeQuery, UnionUnitDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly IOrganizationScopeService _scopeService;

    public GetUnionUnitsTreeQueryHandler(IQLCDDbContext context, ICurrentUserService currentUserService, IOrganizationScopeService scopeService)
    {
        _context = context;
        _currentUserService = currentUserService;
        _scopeService = scopeService;
    }

    public async Task<UnionUnitDto?> Handle(GetUnionUnitsTreeQuery request, CancellationToken cancellationToken)
    {
        var allowed = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowed is { Count: 0 })
            return null;

        var units = _context.DonViCongDoans.OperationalUnits().AsNoTracking();
        var members = _context.DoanViens.AsNoTracking();
        if (allowed is not null)
        {
            units = units.Where(unit => allowed.Contains(unit.Id));
            members = members.Where(member => allowed.Contains(member.MaToCongDoan));
        }
        var eligibleUnits = _context.DonViCongDoans.EligibleUnits();
        var allDtos = await units.Select(u => new UnionUnitDto
        {
            Id = u.Id,
            TenDonVi = u.TenDonVi,
            LoaiToChuc = u.LoaiToChuc,
            Level = u.Level,
            MaParent = u.MaParent,
            MaKhoi = u.MaKhoi,
            TenKhoi = _context.KhoiChuyenMons.IgnoreQueryFilters().Where(b => b.Id == u.MaKhoi).Select(b => b.TenKhoi).FirstOrDefault(),
            KhoiDangSuDung = _context.KhoiChuyenMons.IgnoreQueryFilters().Any(b => b.Id == u.MaKhoi && b.TrangThai && !b.IsDeleted),
            TrangThai = u.TrangThai,
            CoTheTiepNhanDoanVien = eligibleUnits.Any(eligible => eligible.Id == u.Id)
        }).ToListAsync(cancellationToken);
        var activeMembers = await members.Where(d => d.TrangThai == TrangThaiDoanVien.DangSinhHoat)
            .Select(d => new 
            { 
                d.Id, 
                d.MaToCongDoan,
                d.GioiTinh,
                d.DangVien,
                d.TrinhDoHocVan,
                CoNgoaiNgu = d.DoanVienNgoaiNgus.Any()
            })
            .ToListAsync(cancellationToken);

        // Thống kê số lượng theo từng đơn vị trực tiếp
        var memberStatsByUnit = activeMembers
            .GroupBy(d => d.MaToCongDoan)
            .ToDictionary(
                g => g.Key,
                g => new UnitStats
                {
                    SoDoanVien = g.Count(),
                    SoDoanVienNam = g.Count(d => d.GioiTinh == 1),
                    SoDoanVienNu = g.Count(d => d.GioiTinh == 0),
                    SoDoanVienDangVien = g.Count(d => d.DangVien),
                    SoTrinhDoDaiHoc = g.Count(d => d.TrinhDoHocVan == "Đại học" || d.TrinhDoHocVan == "Thạc sĩ" || d.TrinhDoHocVan == "Tiến sĩ"),
                    SoCoNgoaiNgu = g.Count(d => d.CoNgoaiNgu)
                });

        // 3. Xây dựng cây tổ chức
        var dtoMap = allDtos.ToDictionary(d => d.Id);

        // Ghép quan hệ cha-con
        foreach (var dto in allDtos)
        {
            if (dto.MaParent is Guid parentId && dtoMap.TryGetValue(parentId, out var parent) && parent.Level < dto.Level)
                parent.Children.Add(dto);
        }

        var root = allowed is null
            ? allDtos.FirstOrDefault(unit => unit.LoaiToChuc == LoaiToChuc.CDCS)
            : allDtos.FirstOrDefault(unit => unit.Id == _currentUserService.OrganizationId);

        if (root is not null)
            CalculateMembersRecursive(root, memberStatsByUnit);
        return root;
    }

    private UnitStats CalculateMembersRecursive(UnionUnitDto node, Dictionary<Guid, UnitStats> memberStats)
    {
        // Lấy thống kê trực tiếp của đơn vị này
        UnitStats directStats = memberStats.TryGetValue(node.Id, out var stats) ? stats : new UnitStats();

        // Tính tổng thống kê từ các đơn vị cấp dưới
        int childrenTotal = 0;
        int childrenNam = 0;
        int childrenNu = 0;
        int childrenDangVien = 0;
        int childrenDaiHoc = 0;
        int childrenNgoaiNgu = 0;

        foreach (var child in node.Children)
        {
            var childStats = CalculateMembersRecursive(child, memberStats);
            childrenTotal += childStats.SoDoanVien;
            childrenNam += childStats.SoDoanVienNam;
            childrenNu += childStats.SoDoanVienNu;
            childrenDangVien += childStats.SoDoanVienDangVien;
            childrenDaiHoc += childStats.SoTrinhDoDaiHoc;
            childrenNgoaiNgu += childStats.SoCoNgoaiNgu;
        }

        node.SoDoanVien = directStats.SoDoanVien + childrenTotal;
        node.SoDoanVienNam = directStats.SoDoanVienNam + childrenNam;
        node.SoDoanVienNu = directStats.SoDoanVienNu + childrenNu;
        node.SoDoanVienDangVien = directStats.SoDoanVienDangVien + childrenDangVien;
        node.SoTrinhDoDaiHoc = directStats.SoTrinhDoDaiHoc + childrenDaiHoc;
        node.SoCoNgoaiNgu = directStats.SoCoNgoaiNgu + childrenNgoaiNgu;

        return new UnitStats
        {
            SoDoanVien = node.SoDoanVien,
            SoDoanVienNam = node.SoDoanVienNam,
            SoDoanVienNu = node.SoDoanVienNu,
            SoDoanVienDangVien = node.SoDoanVienDangVien,
            SoTrinhDoDaiHoc = node.SoTrinhDoDaiHoc,
            SoCoNgoaiNgu = node.SoCoNgoaiNgu
        };
    }
}
