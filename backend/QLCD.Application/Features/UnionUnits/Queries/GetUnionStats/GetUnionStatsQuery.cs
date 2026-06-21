using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;

public record GetUnionStatsQuery : IRequest<UnionStatsDto>
{
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CountPair
{
    public required string Name { get; set; }
    public int Count { get; set; }
}

public class UnionStatsDto
{
    // Đoàn viên
    public int TongDoanVien { get; set; }
    public int DoanVienNam { get; set; }
    public int DoanVienNu { get; set; }
    public int DoanVienDangSinhHoat { get; set; }
    public int DoanVienDangVien { get; set; }
    public double TiLeDangVien { get; set; }
    public double TiLeNu { get; set; }

    // Tổ chức
    public int TongCDBP { get; set; }
    public int TongToCongDoan { get; set; }

    // Biến động tháng hiện tại
    public int KetNapMoiThang { get; set; }
    public int ChuyenDiThang { get; set; }
    public int NghiHuuThang { get; set; }

    // Phân bổ (Mới bổ sung)
    public List<CountPair> DoanVienTheoCdbp { get; set; } = new();
    public List<CountPair> DoanVienTheoToCd { get; set; } = new();
    public List<CountPair> DoanVienTheoKhoi { get; set; } = new();
    public List<CountPair> DoanVienTheoGioiTinh { get; set; } = new();
    public List<CountPair> DoanVienTheoTrangThai { get; set; } = new();
    public List<CountPair> DoanVienTheoChatLuong { get; set; } = new();
    public List<CountPair> DoanVienTheoChucVu { get; set; } = new();
    public List<CountPair> DoanVienTheoNgoaiNgu { get; set; } = new();
    public List<CountPair> DoanVienTheoTrinhDo { get; set; } = new();

    // Tài chính & Nghiệp vụ (Mới bổ sung)
    public decimal TongThuDoanPhi { get; set; }
    public decimal TongChi { get; set; }
    public decimal TonQuy { get; set; }
    public int SoHoatDong { get; set; }
    public int SoLuotPhucLoi { get; set; }
    public int SoSangKien { get; set; }
    public int SoKetQuaThiDua { get; set; }
}

public class GetUnionStatsQueryHandler : IRequestHandler<GetUnionStatsQuery, UnionStatsDto>
{
    private readonly IQLCDDbContext _context;

    public GetUnionStatsQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<UnionStatsDto> Handle(GetUnionStatsQuery request, CancellationToken cancellationToken)
    {
        // 1. Xác định phạm vi Tổ chức để lọc dữ liệu
        List<Guid> scopedUnitIds = new();
        bool isScoped = !string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS";

        if (isScoped && request.ScopeOrgId.HasValue)
        {
            var orgId = request.ScopeOrgId.Value;
            scopedUnitIds.Add(orgId);
            
            if (request.UserRole == "CDBP")
            {
                // Thêm các Tổ công đoàn trực thuộc
                var children = await _context.DonViCongDoans
                    .Where(u => u.MaParent == orgId)
                    .Select(u => u.Id)
                    .ToListAsync(cancellationToken);
                scopedUnitIds.AddRange(children);
            }
        }

        // 2. Lấy dữ liệu Đơn vị
        var unitsQuery = _context.DonViCongDoans.AsQueryable();
        if (isScoped)
        {
            unitsQuery = unitsQuery.Where(u => scopedUnitIds.Contains(u.Id));
        }
        var allUnits = await unitsQuery.ToListAsync(cancellationToken);

        // 3. Lấy dữ liệu Đoàn viên
        var membersQuery = _context.DoanViens.AsQueryable();
        if (isScoped)
        {
            membersQuery = membersQuery.Where(d => scopedUnitIds.Contains(d.MaToCongDoan));
        }
        var allMembers = await membersQuery
            .Include(d => d.ToCongDoan)
            .Include(d => d.DoanVienNgoaiNgus)
            .ToListAsync(cancellationToken);

        var activeMembers = allMembers.Where(d => d.TrangThai == TrangThaiDoanVien.DangSinhHoat).ToList();
        var totalActive = activeMembers.Count;

        // 4. Lấy dữ liệu Biến động (lọc theo tháng và scope)
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var changesQuery = _context.LichSuBienDongs.Where(b => b.NgayHieuLuc >= monthStart);
        if (isScoped)
        {
            changesQuery = changesQuery.Where(b => 
                (b.TuToCongDoanId.HasValue && scopedUnitIds.Contains(b.TuToCongDoanId.Value)) || 
                (b.DenToCongDoanId.HasValue && scopedUnitIds.Contains(b.DenToCongDoanId.Value)));
        }
        var monthChanges = await changesQuery.ToListAsync(cancellationToken);

        // 5. Lấy dữ liệu Tài chính
        var financeQuery = _context.TaiChinhCongDoans.AsQueryable();
        if (isScoped)
        {
            financeQuery = financeQuery.Where(t => scopedUnitIds.Contains(t.DonViId));
        }
        var finances = await financeQuery.ToListAsync(cancellationToken);

        // 6. Lấy dữ liệu các phân hệ
        var activitiesQuery = _context.HoatDongCongDoans.AsQueryable();
        var welfareQuery = _context.PhucLoiDoanViens.AsQueryable();
        var initiativesQuery = _context.SangKiens.AsQueryable();
        var emulationsQuery = _context.ThiDuaCongDoans.AsQueryable();

        if (isScoped)
        {
            activitiesQuery = activitiesQuery.Where(a => scopedUnitIds.Contains(a.DonViId));
            welfareQuery = welfareQuery.Where(w => scopedUnitIds.Contains(w.DonViId));
            initiativesQuery = initiativesQuery.Where(i => scopedUnitIds.Contains(i.DonViId));
            emulationsQuery = emulationsQuery.Where(e => 
                (e.DonViId.HasValue && scopedUnitIds.Contains(e.DonViId.Value)) ||
                (e.DoanVienId.HasValue && e.DoanVien != null && scopedUnitIds.Contains(e.DoanVien.MaToCongDoan)));
        }

        var soHoatDong = await activitiesQuery.CountAsync(cancellationToken);
        var soWelfare = await welfareQuery.CountAsync(cancellationToken);
        var soInitiative = await initiativesQuery.CountAsync(cancellationToken);
        var soEmulation = await emulationsQuery.CountAsync(cancellationToken);

        // 7. Tính toán Tài chính
        // Thu đoàn phí (THU_DOAN_PHI)
        var tongThu = finances.Where(t => t.LoaiGiaoDich.StartsWith("THU_")).Sum(t => t.SoTien);
        var tongChi = finances.Where(t => t.LoaiGiaoDich.StartsWith("CHI_")).Sum(t => t.SoTien);

        // 8. Tính toán các phân bổ (distributions)
        // Dưới CĐCS: Phân bổ theo CĐBP
        var listCdbp = new List<CountPair>();
        var listToCd = new List<CountPair>();
        var listKhoi = new List<CountPair>();
        var listGioiTinh = new List<CountPair>();
        var listTrangThai = new List<CountPair>();
        var listChatLuong = new List<CountPair>();
        var listChucVu = new List<CountPair>();
        var listNgoaiNgu = new List<CountPair>();

        // Lấy danh mục để giải nghĩa tên
        var allCatalogs = await _context.DanhMucDungChungs.AsNoTracking().ToListAsync(cancellationToken);
        var genderMap = allCatalogs.Where(c => c.Loai == "GioiTinh").ToDictionary(c => c.Ma, c => c.Ten);
        var statusMap = allCatalogs.Where(c => c.Loai == "TrangThaiDoanVien").ToDictionary(c => c.Ma, c => c.Ten);
        var qualityMap = allCatalogs.Where(c => c.Loai == "ChatLuongDoanVien").ToDictionary(c => c.Ma, c => c.Ten);
        var positionMap = allCatalogs.Where(c => c.Loai == "ChucVuCongDoan").ToDictionary(c => c.Ma, c => c.Ten);
        var langMap = allCatalogs.Where(c => c.Loai == "NgoaiNgu").ToDictionary(c => c.Ma, c => c.Ten);

        // Group members by CĐBP
        var cdbpUnits = allUnits
            .Where(u => u.LoaiToChuc == LoaiToChuc.CDBP)
            .ToList();

        foreach (var cdbp in cdbpUnits)
        {
            var childIds = await _context.DonViCongDoans
                .Where(u => u.MaParent == cdbp.Id)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var count = activeMembers.Count(m => m.MaToCongDoan == cdbp.Id || childIds.Contains(m.MaToCongDoan));
            listCdbp.Add(new CountPair { Name = cdbp.TenDonVi, Count = count });
        }

        // Group members by Tổ công đoàn
        var toCdUnits = allUnits.Where(u => u.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || u.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS).ToList();
        foreach (var toCd in toCdUnits)
        {
            var count = activeMembers.Count(m => m.MaToCongDoan == toCd.Id);
            listToCd.Add(new CountPair { Name = toCd.TenDonVi, Count = count });
        }

        // Khối chuyên môn (sử dụng KhoiChuyenMon hoặc Danhmuc)
        var khoiList = await _context.KhoiChuyenMons.ToListAsync(cancellationToken);
        foreach (var khoi in khoiList)
        {
            // Lấy các đơn vị thuộc khối
            var unitIdsInKhoi = await _context.DonViCongDoans
                .Where(u => u.MaKhoi == khoi.Id)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
            
            // Tìm các tổ công đoàn con của những đơn vị thuộc khối đó
            var childToCdIds = await _context.DonViCongDoans
                .Where(u => u.MaParent.HasValue && unitIdsInKhoi.Contains(u.MaParent.Value))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var combinedIds = unitIdsInKhoi.Concat(childToCdIds).Distinct().ToList();

            var count = activeMembers.Count(m => combinedIds.Contains(m.MaToCongDoan));
            listKhoi.Add(new CountPair { Name = khoi.TenKhoi, Count = count });
        }

        // Giới tính
        var maleCount = activeMembers.Count(m => m.GioiTinh == 1);
        var femaleCount = activeMembers.Count(m => m.GioiTinh == 0);
        var otherGenderCount = activeMembers.Count(m => m.GioiTinh == 2);
        listGioiTinh.Add(new CountPair { Name = "Nam", Count = maleCount });
        listGioiTinh.Add(new CountPair { Name = "Nữ", Count = femaleCount });
        if (otherGenderCount > 0) listGioiTinh.Add(new CountPair { Name = "Khác", Count = otherGenderCount });

        // Trạng thái đoàn viên
        var statusGroups = allMembers.GroupBy(m => m.TrangThai);
        foreach (var g in statusGroups)
        {
            string label = statusMap.TryGetValue(g.Key.ToString(), out var name) ? name : g.Key.ToString();
            listTrangThai.Add(new CountPair { Name = label, Count = g.Count() });
        }

        // Nhóm theo chức vụ công đoàn
        var posGroups = activeMembers.GroupBy(m => m.VaiTro);
        foreach (var g in posGroups)
        {
            string label = g.Key.ToString(); // Or lookup from positionMap using g.Key.ToString()
            listChucVu.Add(new CountPair { Name = label, Count = g.Count() });
        }

        // Nhóm theo ngoại ngữ (tính trên số lượng chứng chỉ ngoại ngữ)
        var allMemberLanguages = activeMembers.SelectMany(m => m.DoanVienNgoaiNgus).ToList();
        var langGroups = allMemberLanguages.GroupBy(l => l.NgoaiNgu);
        foreach (var g in langGroups)
        {
            string label = langMap.TryGetValue(g.Key, out var name) ? name : g.Key;
            listNgoaiNgu.Add(new CountPair { Name = label, Count = g.Count() });
        }

        // Nhóm theo trình độ học vấn
        var listTrinhDo = new List<CountPair>();
        var trinhDoGroups = activeMembers
            .Where(m => !string.IsNullOrEmpty(m.TrinhDoHocVan))
            .GroupBy(m => m.TrinhDoHocVan);
        foreach (var g in trinhDoGroups)
        {
            listTrinhDo.Add(new CountPair { Name = g.Key!, Count = g.Count() });
        }

        return new UnionStatsDto
        {
            TongDoanVien = totalActive,
            DoanVienNam = maleCount,
            DoanVienNu = femaleCount,
            DoanVienDangSinhHoat = totalActive,
            DoanVienDangVien = activeMembers.Count(d => d.DangVien),
            TiLeDangVien = totalActive > 0 ? Math.Round((double)activeMembers.Count(d => d.DangVien) / totalActive * 100, 1) : 0,
            TiLeNu = totalActive > 0 ? Math.Round((double)femaleCount / totalActive * 100, 1) : 0,

            TongCDBP = allUnits.Count(u => u.LoaiToChuc == LoaiToChuc.CDBP),
            TongToCongDoan = allUnits.Count(u => u.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || u.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS),

            KetNapMoiThang = monthChanges.Count(b => b.LoaiBienDong == LoaiBienDong.KetNapMoi),
            ChuyenDiThang = monthChanges.Count(b => b.LoaiBienDong == LoaiBienDong.ChuyenSinhHoat || b.LoaiBienDong == LoaiBienDong.DieuDongCongTac),
            NghiHuuThang = monthChanges.Count(b => b.LoaiBienDong == LoaiBienDong.NghiHuu),

            DoanVienTheoCdbp = listCdbp,
            DoanVienTheoToCd = listToCd,
            DoanVienTheoKhoi = listKhoi,
            DoanVienTheoGioiTinh = listGioiTinh,
            DoanVienTheoTrangThai = listTrangThai,
            DoanVienTheoChucVu = listChucVu,
            DoanVienTheoNgoaiNgu = listNgoaiNgu,
            DoanVienTheoTrinhDo = listTrinhDo,

            TongThuDoanPhi = tongThu,
            TongChi = tongChi,
            TonQuy = tongThu - tongChi,
            SoHoatDong = soHoatDong,
            SoLuotPhucLoi = soWelfare,
            SoSangKien = soInitiative,
            SoKetQuaThiDua = soEmulation
        };
    }
}

