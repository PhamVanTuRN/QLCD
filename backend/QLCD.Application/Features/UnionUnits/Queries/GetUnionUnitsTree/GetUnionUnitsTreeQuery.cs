using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
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
    public int SoDoanVien { get; set; }
    
    // Thống kê chi tiết
    public int SoDoanVienNam { get; set; }
    public int SoDoanVienNu { get; set; }
    public int SoDoanVienDangVien { get; set; }
    public int SoDoanVienDangVienDuBi { get; set; }
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
    public int SoDoanVienDangVienDuBi { get; set; }
    public int SoTrinhDoDaiHoc { get; set; }
    public int SoCoNgoaiNgu { get; set; }
}

public class GetUnionUnitsTreeQueryHandler : IRequestHandler<GetUnionUnitsTreeQuery, UnionUnitDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUnionUnitsTreeQueryHandler(IQLCDDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UnionUnitDto?> Handle(GetUnionUnitsTreeQuery request, CancellationToken cancellationToken)
    {
        // 1. Tải toàn bộ danh sách đơn vị đang hoạt động (Soft delete đã được xử lý bởi Global Query Filter)
        var allUnits = await _context.DonViCongDoans
            .ToListAsync(cancellationToken);

        // 2. Tải toàn bộ đoàn viên đang sinh hoạt
        var activeMembers = await _context.DoanViens
            .Where(d => d.TrangThai == TrangThaiDoanVien.DangSinhHoat)
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
                    SoDoanVienDangVien = g.Count(d => d.DangVien == "Đảng viên chính thức"),
                    SoDoanVienDangVienDuBi = g.Count(d => d.DangVien == "Đảng viên dự bị"),
                    SoTrinhDoDaiHoc = g.Count(d => d.TrinhDoHocVan == "Đại học" || d.TrinhDoHocVan == "Thạc sĩ" || d.TrinhDoHocVan == "Tiến sĩ"),
                    SoCoNgoaiNgu = g.Count(d => d.CoNgoaiNgu)
                });

        // 3. Xây dựng cây tổ chức
        var allDtos = allUnits.Select(u => new UnionUnitDto
        {
            Id = u.Id,
            TenDonVi = u.TenDonVi,
            LoaiToChuc = u.LoaiToChuc,
            Level = u.Level,
            MaParent = u.MaParent,
            MaKhoi = u.MaKhoi,
            SoDoanVien = 0
        }).ToList();

        var dtoMap = allDtos.ToDictionary(d => d.Id);

        // Ghép quan hệ cha-con
        foreach (var dto in allDtos)
        {
            if (dto.MaParent.HasValue && dtoMap.ContainsKey(dto.MaParent.Value))
            {
                dtoMap[dto.MaParent.Value].Children.Add(dto);
            }
        }

        // 4. Tính toán số đoàn viên đệ quy từ dưới lên cho gốc hệ thống
        var rootSystem = allDtos.FirstOrDefault(d => d.LoaiToChuc == LoaiToChuc.CDCS);
        if (rootSystem == null) return null;

        CalculateMembersRecursive(rootSystem, memberStatsByUnit);

        // Sắp xếp cây tổ chức theo nhóm Khối Chuyên môn
        var khoiList = await _context.KhoiChuyenMons.ToListAsync(cancellationToken);
        SortTreeRecursive(rootSystem, khoiList);

        // 5. Trim tree to the user's scoped unit root if role is CDBP or TOCD
        if (!_currentUserService.IsAdmin && !_currentUserService.IsCdcs && _currentUserService.OrganizationId.HasValue)
        {
            var userOrgId = _currentUserService.OrganizationId.Value;
            var userRoot = allDtos.FirstOrDefault(d => d.Id == userOrgId);
            return userRoot;
        }

        return rootSystem;
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
        int childrenDangVienDuBi = 0;
        int childrenDaiHoc = 0;
        int childrenNgoaiNgu = 0;

        foreach (var child in node.Children)
        {
            var childStats = CalculateMembersRecursive(child, memberStats);
            childrenTotal += childStats.SoDoanVien;
            childrenNam += childStats.SoDoanVienNam;
            childrenNu += childStats.SoDoanVienNu;
            childrenDangVien += childStats.SoDoanVienDangVien;
            childrenDangVienDuBi += childStats.SoDoanVienDangVienDuBi;
            childrenDaiHoc += childStats.SoTrinhDoDaiHoc;
            childrenNgoaiNgu += childStats.SoCoNgoaiNgu;
        }

        node.SoDoanVien = directStats.SoDoanVien + childrenTotal;
        node.SoDoanVienNam = directStats.SoDoanVienNam + childrenNam;
        node.SoDoanVienNu = directStats.SoDoanVienNu + childrenNu;
        node.SoDoanVienDangVien = directStats.SoDoanVienDangVien + childrenDangVien;
        node.SoDoanVienDangVienDuBi = directStats.SoDoanVienDangVienDuBi + childrenDangVienDuBi;
        node.SoTrinhDoDaiHoc = directStats.SoTrinhDoDaiHoc + childrenDaiHoc;
        node.SoCoNgoaiNgu = directStats.SoCoNgoaiNgu + childrenNgoaiNgu;

        return new UnitStats
        {
            SoDoanVien = node.SoDoanVien,
            SoDoanVienNam = node.SoDoanVienNam,
            SoDoanVienNu = node.SoDoanVienNu,
            SoDoanVienDangVien = node.SoDoanVienDangVien,
            SoDoanVienDangVienDuBi = node.SoDoanVienDangVienDuBi,
            SoTrinhDoDaiHoc = node.SoTrinhDoDaiHoc,
            SoCoNgoaiNgu = node.SoCoNgoaiNgu
        };
    }

    private void SortTreeRecursive(UnionUnitDto node, List<KhoiChuyenMon> khoiList)
    {
        node.Children = node.Children
            .OrderBy(c => GetSortOrder(c.MaKhoi, c.TenDonVi, khoiList))
            .ThenBy(c => c.TenDonVi)
            .ToList();

        foreach (var child in node.Children)
        {
            SortTreeRecursive(child, khoiList);
        }
    }

    private int GetSortOrder(Guid? maKhoi, string tenDonVi, List<KhoiChuyenMon> khoiList)
    {
        if (maKhoi.HasValue)
        {
            var khoi = khoiList.FirstOrDefault(k => k.Id == maKhoi.Value);
            if (khoi != null)
            {
                var tenKhoi = khoi.TenKhoi.ToLower();
                if (tenKhoi.Contains("cơ quan")) return 1;
                if (tenKhoi.Contains("nội")) return 2;
                if (tenKhoi.Contains("ngoại")) return 3;
                if (tenKhoi.Contains("cận lâm sàng")) return 4;
            }
        }

        var nameLower = tenDonVi.ToLower();
        if (nameLower.Contains("cơ quan") || nameLower.Contains("liên cơ quan")) return 1;
        if (nameLower.Contains("nội")) return 2;
        if (nameLower.Contains("ngoại")) return 3;
        if (nameLower.Contains("cận lâm sàng")) return 4;

        return 5;
    }
}
