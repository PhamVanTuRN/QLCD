using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Security;
using QLCD.Domain.Enums;
using QLCD.Application.Features.Emulations.Queries.GetEmulations;

namespace QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;

public record GetUnionStatsQuery : IRequest<UnionStatsDto>
{
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
    private readonly ICurrentUserService _currentUserService;
    private readonly IOrganizationScopeService _scopeService;
    private readonly TimeProvider _clock;

    public GetUnionStatsQueryHandler(IQLCDDbContext context, ICurrentUserService currentUserService,
        IOrganizationScopeService scopeService, TimeProvider clock)
    {
        _context = context;
        _currentUserService = currentUserService;
        _scopeService = scopeService;
        _clock = clock;
    }

    public async Task<UnionStatsDto> Handle(GetUnionStatsQuery request, CancellationToken cancellationToken)
    {
        var allowed = await _scopeService.GetAllowedOrganizationIdsAsync(cancellationToken);
        var isScoped = allowed is not null;
        var scopedUnitIds = allowed ?? [];
        if (isScoped && scopedUnitIds.Count == 0)
            return new UnionStatsDto();

        // 2. Lấy dữ liệu Đơn vị
        var unitsQuery = _context.DonViCongDoans.AsNoTracking();
        if (isScoped)
        {
            unitsQuery = unitsQuery.Where(u => scopedUnitIds.Contains(u.Id));
        }
        var allUnits = await unitsQuery.ToListAsync(cancellationToken);

        // 3. Lấy dữ liệu Đoàn viên
        var membersQuery = _context.DoanViens.AsNoTracking();
        if (isScoped)
        {
            membersQuery = membersQuery.Where(d => scopedUnitIds.Contains(d.MaToCongDoan));
        }
        var allMembers = await membersQuery
            .Select(member => new
            {
                member.MaToCongDoan, member.TrangThai, member.DangVien, member.GioiTinh,
                member.VaiTro, member.TrinhDoHocVan,
                Languages = member.DoanVienNgoaiNgus.Select(language => language.NgoaiNgu).ToList()
            })
            .ToListAsync(cancellationToken);

        var activeMembers = allMembers.Where(d => d.TrangThai == TrangThaiDoanVien.DangSinhHoat).ToList();
        var totalActive = activeMembers.Count;

        // 4. Lấy dữ liệu Biến động (lọc theo tháng và scope)
        var vietnamOffset = TimeSpan.FromHours(7);
        var now = _clock.GetUtcNow().ToOffset(vietnamOffset);
        var start = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, vietnamOffset);
        var monthStart = start.UtcDateTime;
        var monthEnd = start.AddMonths(1).UtcDateTime;
        var changesQuery = _context.LichSuBienDongs.AsNoTracking()
            .Where(change => change.NgayHieuLuc >= monthStart && change.NgayHieuLuc < monthEnd);
        if (isScoped)
        {
            changesQuery = changesQuery.Where(change =>
                change.LoaiBienDong == LoaiBienDong.KetNapMoi
                    ? change.DenToCongDoanId.HasValue && scopedUnitIds.Contains(change.DenToCongDoanId.Value)
                    : change.TuToCongDoanId.HasValue && scopedUnitIds.Contains(change.TuToCongDoanId.Value));
        }
        var monthChanges = await changesQuery.GroupBy(change => change.LoaiBienDong)
            .Select(group => new { Kind = group.Key, Count = group.Count() })
            .ToDictionaryAsync(group => group.Kind, group => group.Count, cancellationToken);

        // 5. Lấy dữ liệu Tài chính
        var financeQuery = _context.TaiChinhCongDoans.AsNoTracking();
        if (isScoped)
        {
            financeQuery = financeQuery.Where(t => scopedUnitIds.Contains(t.DonViId));
        }
        financeQuery = _currentUserService.Role switch
        {
            SecurityRoles.Central or SecurityRoles.Department => financeQuery,
            SecurityRoles.Team => financeQuery.Where(transaction => transaction.LoaiGiaoDich == "THU_DOAN_PHI"),
            _ => financeQuery.Where(_ => false)
        };

        // 6. Lấy dữ liệu các phân hệ
        var activitiesQuery = _context.HoatDongCongDoans.AsNoTracking();
        var welfareQuery = _context.PhucLoiDoanViens.AsNoTracking();
        var initiativesQuery = _context.SangKiens.AsNoTracking();
        var emulationsQuery = EmulationScope.Apply(_context.ThiDuaCongDoans.AsNoTracking(), allowed);

        if (isScoped)
        {
            activitiesQuery = activitiesQuery.Where(a => scopedUnitIds.Contains(a.DonViId));
            welfareQuery = welfareQuery.Where(w => scopedUnitIds.Contains(w.DonViId));
            initiativesQuery = initiativesQuery.Where(i => scopedUnitIds.Contains(i.DonViId));
        }

        var soHoatDong = await activitiesQuery.CountAsync(cancellationToken);
        var canViewBusiness = _currentUserService.Role is SecurityRoles.Central or SecurityRoles.Department or SecurityRoles.Team;
        var soWelfare = canViewBusiness ? await welfareQuery.CountAsync(cancellationToken) : 0;
        var soInitiative = canViewBusiness ? await initiativesQuery.CountAsync(cancellationToken) : 0;
        var soEmulation = canViewBusiness ? await emulationsQuery.CountAsync(cancellationToken) : 0;

        // 7. Tính toán Tài chính
        // Thu đoàn phí (THU_DOAN_PHI)
        var tongThu = await financeQuery.Where(t => t.LoaiGiaoDich.StartsWith("THU_")).SumAsync(t => t.SoTien, cancellationToken);
        var tongChi = await financeQuery.Where(t => t.LoaiGiaoDich.StartsWith("CHI_")).SumAsync(t => t.SoTien, cancellationToken);

        // 8. Tính toán các phân bổ (distributions)
        // Dưới CĐCS: Phân bổ theo CĐBP
        var listCdbp = new List<CountPair>();
        var listToCd = new List<CountPair>();
        var listKhoi = new List<CountPair>();
        var listGioiTinh = new List<CountPair>();
        var listTrangThai = new List<CountPair>();
        var listChucVu = new List<CountPair>();
        var listNgoaiNgu = new List<CountPair>();

        // Lấy danh mục để giải nghĩa tên
        var langMap = await _context.DanhMucDungChungs.AsNoTracking().Where(c => c.Loai == "NgoaiNgu")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);
        var unitCounts = activeMembers.GroupBy(member => member.MaToCongDoan)
            .ToDictionary(group => group.Key, group => group.Count());

        // Group members by CĐBP
        var cdbpUnits = allUnits
            .Where(u => u.LoaiToChuc == LoaiToChuc.CDBP)
            .ToList();

        foreach (var cdbp in cdbpUnits)
        {
            var childIds = allUnits.Where(u => u.MaParent == cdbp.Id).Select(u => u.Id).ToHashSet();

            var count = unitCounts.GetValueOrDefault(cdbp.Id) + childIds.Sum(id => unitCounts.GetValueOrDefault(id));
            listCdbp.Add(new CountPair { Name = cdbp.TenDonVi, Count = count });
        }

        // Group members by Tổ công đoàn
        var toCdUnits = allUnits.Where(u => u.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || u.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS).ToList();
        foreach (var toCd in toCdUnits)
        {
            var count = unitCounts.GetValueOrDefault(toCd.Id);
            listToCd.Add(new CountPair { Name = toCd.TenDonVi, Count = count });
        }

        // Khối chuyên môn (sử dụng KhoiChuyenMon hoặc Danhmuc)
        var khoiList = await _context.KhoiChuyenMons.IgnoreQueryFilters().AsNoTracking().ToListAsync(cancellationToken);
        foreach (var khoi in khoiList)
        {
            // Lấy các đơn vị thuộc khối
            var unitIdsInKhoi = allUnits.Where(u => u.MaKhoi == khoi.Id).Select(u => u.Id).ToHashSet();
            var count = activeMembers.Count(d => unitIdsInKhoi.Contains(d.MaToCongDoan));
            listKhoi.Add(new CountPair { Name = khoi.TenKhoi, Count = count });
        }

        var unclassifiedUnits = allUnits.Where(u => u.MaKhoi == null).Select(u => u.Id).ToHashSet();
        listKhoi.Add(new CountPair { Name = "Chưa phân khối", Count = activeMembers.Count(m => unclassifiedUnits.Contains(m.MaToCongDoan)) });

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
            var label = g.Key switch
            {
                TrangThaiDoanVien.DangSinhHoat => "Đang sinh hoạt",
                TrangThaiDoanVien.ChuyenDi => "Chuyển đi",
                TrangThaiDoanVien.NghiHuu => "Nghỉ hưu",
                TrangThaiDoanVien.RaKhoiCongDoan => "Ra khỏi công đoàn",
                TrangThaiDoanVien.TamDung => "Tạm dừng",
                TrangThaiDoanVien.KhoiPhuc => "Khôi phục",
                _ => g.Key.ToString()
            };
            listTrangThai.Add(new CountPair { Name = label, Count = g.Count() });
        }

        // Nhóm theo chức vụ công đoàn
        var posGroups = activeMembers.GroupBy(m => m.VaiTro);
        foreach (var g in posGroups)
        {
            string label = g.Key.ToString();
            listChucVu.Add(new CountPair { Name = label, Count = g.Count() });
        }

        // Nhóm theo ngoại ngữ (tính trên số lượng chứng chỉ ngoại ngữ)
        var allMemberLanguages = activeMembers.SelectMany(m => m.Languages).ToList();
        var langGroups = allMemberLanguages.GroupBy(language => language);
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

            KetNapMoiThang = monthChanges.GetValueOrDefault(LoaiBienDong.KetNapMoi),
            ChuyenDiThang = monthChanges.GetValueOrDefault(LoaiBienDong.ChuyenSinhHoat) + monthChanges.GetValueOrDefault(LoaiBienDong.DieuDongCongTac),
            NghiHuuThang = monthChanges.GetValueOrDefault(LoaiBienDong.NghiHuu),

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

