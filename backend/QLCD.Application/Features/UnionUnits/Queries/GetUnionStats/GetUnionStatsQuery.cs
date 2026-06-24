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

    // Filters
    public Guid? MaKhoi { get; init; }
    public Guid? FilterOrgId { get; init; }
    public DateTime? FromDate { get; init; }
    public DateTime? ToDate { get; init; }
    public int? Month { get; init; }
    public int? Quarter { get; init; }
    public int? Year { get; init; }
    public string? SearchKeyword { get; init; }
}

public class CountPair
{
    public required string Name { get; set; }
    public int Count { get; set; }
}

public class FinanceChartItem
{
    public required string TimeLabel { get; set; }
    public decimal Thu { get; set; }
    public decimal Chi { get; set; }
}

public class ActivityChartItem
{
    public required string TimeLabel { get; set; }
    public int Count { get; set; }
}

public class EmulationChartItem
{
    public required string OrganizationName { get; set; }
    public int DatGiai { get; set; }
    public int DatYeuCau { get; set; }
    public int ChuaDat { get; set; }
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

    // Biểu đồ
    public List<FinanceChartItem> ThuChiTheoThoiGian { get; set; } = new();
    public List<ActivityChartItem> HoatDongTheoThang { get; set; } = new();
    public List<EmulationChartItem> ThiDuaTheoToChuc { get; set; } = new();
}

public class GetUnionStatsQueryHandler : IRequestHandler<GetUnionStatsQuery, UnionStatsDto>
{
    private readonly IQLCDDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetUnionStatsQueryHandler(IQLCDDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<UnionStatsDto> Handle(GetUnionStatsQuery request, CancellationToken cancellationToken)
    {
        // 1. Phân quyền và phạm vi Đơn vị được phép truy cập (allowedUnitIds)
        var role = request.UserRole ?? _currentUserService.Role;
        var userOrgIdVal = request.ScopeOrgId ?? _currentUserService.OrganizationId;

        bool isScoped = !string.IsNullOrEmpty(role) && 
                        !string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase) && 
                        !string.Equals(role, "CDCS", StringComparison.OrdinalIgnoreCase);

        List<Guid> allowedUnitIds = new();
        if (isScoped && userOrgIdVal.HasValue)
        {
            var userOrgId = userOrgIdVal.Value;
            allowedUnitIds.Add(userOrgId);
            
            if (string.Equals(role, "CDBP", StringComparison.OrdinalIgnoreCase))
            {
                // CDBP được xem chính mình và các tổ trực thuộc
                var children = await _context.DonViCongDoans
                    .Where(u => u.MaParent == userOrgId)
                    .Select(u => u.Id)
                    .ToListAsync(cancellationToken);
                allowedUnitIds.AddRange(children);
            }
        }
        else if (!isScoped)
        {
            // Admin/CDCS có quyền xem toàn bộ hệ thống
            allowedUnitIds = await _context.DonViCongDoans
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
        }

        // 2. Xác định danh sách đơn vị đã được lọc (filteredUnitIds)
        List<Guid> filteredUnitIds = new();

        // 2.1. Lọc theo Tổ chức công đoàn (FilterOrgId)
        if (request.FilterOrgId.HasValue)
        {
            var filterOrgId = request.FilterOrgId.Value;
            if (!isScoped || allowedUnitIds.Contains(filterOrgId))
            {
                filteredUnitIds.Add(filterOrgId);
                
                var orgInfo = await _context.DonViCongDoans
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == filterOrgId, cancellationToken);
                
                if (orgInfo != null)
                {
                    if (orgInfo.LoaiToChuc == LoaiToChuc.CDCS)
                    {
                        // Nếu lọc CDCS (toàn cơ sở) thì lấy toàn bộ các đơn vị cấp dưới trực thuộc và gián tiếp
                        var level2Ids = await _context.DonViCongDoans
                            .Where(u => u.MaParent == filterOrgId)
                            .Select(u => u.Id)
                            .ToListAsync(cancellationToken);
                        filteredUnitIds.AddRange(level2Ids);

                        if (level2Ids.Any())
                        {
                            var level3Ids = await _context.DonViCongDoans
                                .Where(u => u.MaParent.HasValue && level2Ids.Contains(u.MaParent.Value))
                                .Select(u => u.Id)
                                .ToListAsync(cancellationToken);
                            filteredUnitIds.AddRange(level3Ids);
                        }
                    }
                    else if (orgInfo.LoaiToChuc == LoaiToChuc.CDBP)
                    {
                        // Nếu lọc một CDBP thì tự động tính cả các tổ công đoàn trực thuộc
                        var children = await _context.DonViCongDoans
                            .Where(u => u.MaParent == filterOrgId)
                            .Select(u => u.Id)
                            .ToListAsync(cancellationToken);
                        filteredUnitIds.AddRange(children);
                    }
                }
            }
            else
            {
                // filterOrgId nằm ngoài phạm vi được phép, áp dụng phạm vi tối đa của user
                filteredUnitIds.AddRange(allowedUnitIds);
            }
        }
        else
        {
            // Mặc định sử dụng toàn bộ phạm vi đơn vị được phép
            filteredUnitIds.AddRange(allowedUnitIds);
        }

        filteredUnitIds = filteredUnitIds.Distinct().ToList();

        // 2.2. Lọc theo Khối chuyên môn (MaKhoi)
        if (request.MaKhoi.HasValue)
        {
            var maKhoiVal = request.MaKhoi.Value;
            
            // Tìm tất cả các đơn vị thuộc khối hoặc có đơn vị cha thuộc khối
            var parentUnitsInKhoi = await _context.DonViCongDoans
                .Where(u => u.MaKhoi == maKhoiVal)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
            
            var childUnitsInKhoi = await _context.DonViCongDoans
                .Where(u => u.MaParent.HasValue && parentUnitsInKhoi.Contains(u.MaParent.Value))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);
            
            var allUnitsInKhoi = parentUnitsInKhoi.Concat(childUnitsInKhoi).Distinct().ToList();
            
            // Giao với danh sách đơn vị đang xét
            filteredUnitIds = filteredUnitIds.Intersect(allUnitsInKhoi).ToList();
        }

        // 2.3. Lọc theo từ khóa Tìm kiếm nhanh (SearchKeyword)
        if (!string.IsNullOrWhiteSpace(request.SearchKeyword))
        {
            var keyword = request.SearchKeyword.Trim().ToLower();
            
            var matchedUnits = await _context.DonViCongDoans
                .Include(u => u.KhoiChuyenMon)
                .Where(u => u.TenDonVi.ToLower().Contains(keyword) || 
                            u.Id.ToString().ToLower().Contains(keyword) ||
                            (u.KhoiChuyenMon != null && u.KhoiChuyenMon.TenKhoi.ToLower().Contains(keyword)))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var childOfMatched = await _context.DonViCongDoans
                .Where(u => u.MaParent.HasValue && matchedUnits.Contains(u.MaParent.Value))
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var allMatchedUnitIds = matchedUnits.Concat(childOfMatched).Distinct().ToList();
            
            // Giao với danh sách đơn vị đang xét
            filteredUnitIds = filteredUnitIds.Intersect(allMatchedUnitIds).ToList();
        }

        // 3. Xác định Khoảng thời gian (FromDate, ToDate, Month, Quarter, Year)
        DateTime startDate;
        DateTime endDate;
        int currentYear = DateTime.Today.Year;

        if (request.FromDate.HasValue || request.ToDate.HasValue)
        {
            startDate = request.FromDate ?? new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = request.ToDate ?? new DateTime(2099, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        }
        else if (request.Month.HasValue || request.Quarter.HasValue || request.Year.HasValue)
        {
            int year = request.Year ?? currentYear;
            if (request.Month.HasValue)
            {
                int month = request.Month.Value;
                startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
                endDate = startDate.AddMonths(1).AddTicks(-1);
            }
            else if (request.Quarter.HasValue)
            {
                int quarter = request.Quarter.Value;
                int startMonth = ((quarter - 1) * 3) + 1;
                startDate = new DateTime(year, startMonth, 1, 0, 0, 0, DateTimeKind.Utc);
                endDate = startDate.AddMonths(3).AddTicks(-1);
            }
            else
            {
                startDate = new DateTime(year, 1, 1, 0, 0, 0, DateTimeKind.Utc);
                endDate = new DateTime(year, 12, 31, 23, 59, 59, DateTimeKind.Utc);
            }
        }
        else
        {
            // Mặc định hiển thị dữ liệu năm hiện tại
            startDate = new DateTime(currentYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = new DateTime(currentYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        }

        // 4. Lọc & Truy vấn Dữ liệu (tối ưu aggregate SQL)
        var totalActive = await _context.DoanViens
            .CountAsync(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate, cancellationToken);

        var maleCount = await _context.DoanViens
            .CountAsync(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && m.GioiTinh == 1, cancellationToken);
            
        var femaleCount = await _context.DoanViens
            .CountAsync(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && m.GioiTinh == 0, cancellationToken);

        var otherCount = await _context.DoanViens
            .CountAsync(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && m.GioiTinh == 2, cancellationToken);

        var dangVienCount = await _context.DoanViens
            .CountAsync(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && m.DangVien, cancellationToken);

        // Biến động
        var changesQuery = _context.LichSuBienDongs.Where(b => b.NgayHieuLuc >= startDate && b.NgayHieuLuc <= endDate);
        changesQuery = changesQuery.Where(b => 
            (b.TuToCongDoanId.HasValue && filteredUnitIds.Contains(b.TuToCongDoanId.Value)) || 
            (b.DenToCongDoanId.HasValue && filteredUnitIds.Contains(b.DenToCongDoanId.Value)) ||
            filteredUnitIds.Contains(b.DoanVien.MaToCongDoan)
        );

        var ketNapMoiThang = await changesQuery.CountAsync(b => b.LoaiBienDong == LoaiBienDong.KetNapMoi, cancellationToken);
        var chuyenDiThang = await changesQuery.CountAsync(b => b.LoaiBienDong == LoaiBienDong.ChuyenSinhHoat || b.LoaiBienDong == LoaiBienDong.DieuDongCongTac, cancellationToken);
        var nghiHuuThang = await changesQuery.CountAsync(b => b.LoaiBienDong == LoaiBienDong.NghiHuu, cancellationToken);

        // Tài chính
        var financeQuery = _context.TaiChinhCongDoans
            .Where(t => filteredUnitIds.Contains(t.DonViId) && t.NgayGiaoDich >= startDate && t.NgayGiaoDich <= endDate);

        var tongThu = await financeQuery
            .Where(t => t.LoaiGiaoDich.StartsWith("THU_"))
            .SumAsync(t => (decimal?)t.SoTien, cancellationToken) ?? 0;

        var tongChi = await financeQuery
            .Where(t => t.LoaiGiaoDich.StartsWith("CHI_"))
            .SumAsync(t => (decimal?)t.SoTien, cancellationToken) ?? 0;

        // Phân hệ
        var soHoatDong = await _context.HoatDongCongDoans
            .CountAsync(a => filteredUnitIds.Contains(a.DonViId) && a.TuNgay >= startDate && a.TuNgay <= endDate, cancellationToken);

        var soWelfare = await _context.PhucLoiDoanViens
            .CountAsync(w => filteredUnitIds.Contains(w.DonViId) && w.NgayHoTro >= startDate && w.NgayHoTro <= endDate, cancellationToken);

        var soInitiative = await _context.SangKiens
            .CountAsync(i => filteredUnitIds.Contains(i.DonViId) && 
                             ((i.NgayNghiemThu.HasValue && i.NgayNghiemThu >= startDate && i.NgayNghiemThu <= endDate) ||
                              (!i.NgayNghiemThu.HasValue && i.NamThucHien >= startDate.Year && i.NamThucHien <= endDate.Year)), cancellationToken);

        var soEmulation = await _context.ThiDuaCongDoans
            .CountAsync(e => ((e.DonViId.HasValue && filteredUnitIds.Contains(e.DonViId.Value)) ||
                              (e.DoanVienId.HasValue && e.DoanVien != null && filteredUnitIds.Contains(e.DoanVien.MaToCongDoan))) &&
                             e.Nam >= startDate.Year && e.Nam <= endDate.Year, cancellationToken);

        // 5. Tính toán các phân bổ (distributions)
        // Group members by CĐBP
        var listCdbp = await _context.DonViCongDoans
            .Where(u => u.LoaiToChuc == LoaiToChuc.CDBP && filteredUnitIds.Contains(u.Id))
            .Select(u => new CountPair
            {
                Name = u.TenDonVi,
                Count = _context.DoanViens.Count(m => m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && 
                    (m.MaToCongDoan == u.Id || _context.DonViCongDoans.Any(c => c.MaParent == u.Id && c.Id == m.MaToCongDoan)))
            })
            .ToListAsync(cancellationToken);

        // Group members by Tổ công đoàn
        var listToCd = await _context.DonViCongDoans
            .Where(u => (u.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || u.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS) && filteredUnitIds.Contains(u.Id))
            .Select(u => new CountPair
            {
                Name = u.TenDonVi,
                Count = _context.DoanViens.Count(m => m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && m.MaToCongDoan == u.Id)
            })
            .ToListAsync(cancellationToken);

        // Khối chuyên môn
        var listKhoi = await _context.KhoiChuyenMons
            .Select(k => new CountPair
            {
                Name = k.TenKhoi,
                Count = _context.DoanViens.Count(m => m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && 
                    filteredUnitIds.Contains(m.MaToCongDoan) && 
                    _context.DonViCongDoans.Any(u => u.Id == m.MaToCongDoan && (u.MaKhoi == k.Id || (u.MaParent.HasValue && _context.DonViCongDoans.Any(p => p.Id == u.MaParent && p.MaKhoi == k.Id)))))
            })
            .ToListAsync(cancellationToken);

        // Sắp xếp thứ tự hiển thị Khối Chuyên môn
        listKhoi = listKhoi
            .OrderBy(k => k.Name.Contains("Cơ quan") ? 1 :
                          k.Name.Contains("Nội") ? 2 :
                          k.Name.Contains("Ngoại") ? 3 :
                          k.Name.Contains("Cận lâm sàng") ? 4 : 5)
            .ToList();

        // Giới tính
        var listGioiTinh = new List<CountPair>
        {
            new() { Name = "Nam", Count = maleCount },
            new() { Name = "Nữ", Count = femaleCount }
        };
        if (otherCount > 0) listGioiTinh.Add(new() { Name = "Khác", Count = otherCount });

        // Tải danh mục dùng chung để map tên
        var allCatalogs = await _context.DanhMucDungChungs.AsNoTracking().ToListAsync(cancellationToken);
        var statusMap = allCatalogs.Where(c => c.Loai == "TrangThaiDoanVien").ToDictionary(c => c.Ma, c => c.Ten);
        var qualityMap = allCatalogs.Where(c => c.Loai == "ChatLuongDoanVien").ToDictionary(c => c.Ma, c => c.Ten);
        var langMap = allCatalogs.Where(c => c.Loai == "NgoaiNgu").ToDictionary(c => c.Ma, c => c.Ten);

        // Trạng thái đoàn viên
        var statusGroupsRaw = await _context.DoanViens
            .Where(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.NgayVaoCongDoan <= endDate)
            .GroupBy(m => m.TrangThai)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var listTrangThai = statusGroupsRaw
            .Select(x => new CountPair 
            { 
                Name = statusMap.TryGetValue(x.Key.ToString(), out var name) ? name : x.Key.ToString(), 
                Count = x.Count 
            })
            .ToList();

        // Chất lượng đoàn viên (Thi đua cá nhân)
        var qualityGroupsRaw = await _context.ThiDuaCongDoans
            .Where(e => e.DoanVienId.HasValue && e.DoanVien != null && filteredUnitIds.Contains(e.DoanVien.MaToCongDoan) && e.Nam >= startDate.Year && e.Nam <= endDate.Year)
            .GroupBy(e => e.XepLoai)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var listChatLuong = qualityGroupsRaw
            .Select(x => new CountPair
            {
                Name = qualityMap.TryGetValue(x.Key, out var name) ? name : x.Key,
                Count = x.Count
            })
            .ToList();

        // Vai trò công đoàn (Chức vụ)
        var posGroupsRaw = await _context.DoanViens
            .Where(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate)
            .GroupBy(m => m.VaiTro)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var listChucVu = posGroupsRaw
            .Select(x => new CountPair
            {
                Name = GetVaiTroName(x.Key),
                Count = x.Count
            })
            .ToList();

        // Trình độ học vấn
        var trinhDoGroupsRaw = await _context.DoanViens
            .Where(m => filteredUnitIds.Contains(m.MaToCongDoan) && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && !string.IsNullOrEmpty(m.TrinhDoHocVan))
            .GroupBy(m => m.TrinhDoHocVan)
            .Select(g => new { Key = g.Key!, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var listTrinhDo = trinhDoGroupsRaw
            .Select(x => new CountPair { Name = x.Key, Count = x.Count })
            .ToList();

        // Ngoại ngữ
        var langGroupsRaw = await _context.DoanVienNgoaiNgus
            .Where(l => _context.DoanViens.Any(m => m.Id == l.DoanVienId && m.TrangThai == TrangThaiDoanVien.DangSinhHoat && m.NgayVaoCongDoan <= endDate && filteredUnitIds.Contains(m.MaToCongDoan)))
            .GroupBy(l => l.NgoaiNgu)
            .Select(g => new { Key = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);
        var listNgoaiNgu = langGroupsRaw
            .Select(x => new CountPair
            {
                Name = langMap.TryGetValue(x.Key, out var name) ? name : x.Key,
                Count = x.Count
            })
            .ToList();

        // 6. Truy vấn Biểu đồ (tối ưu hóa aggregate)
        // 6.1. Thu chi theo thời gian (Tháng)
        var rawFinances = await financeQuery
            .Select(f => new { f.NgayGiaoDich, f.LoaiGiaoDich, f.SoTien })
            .ToListAsync(cancellationToken);

        var thuChiTheoThoiGian = rawFinances
            .GroupBy(f => f.NgayGiaoDich.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new FinanceChartItem
            {
                TimeLabel = g.Key,
                Thu = g.Where(t => t.LoaiGiaoDich.StartsWith("THU_")).Sum(t => t.SoTien),
                Chi = g.Where(t => t.LoaiGiaoDich.StartsWith("CHI_")).Sum(t => t.SoTien)
            })
            .ToList();

        // 6.2. Hoạt động công đoàn theo tháng
        var rawActivities = await _context.HoatDongCongDoans
            .Where(a => filteredUnitIds.Contains(a.DonViId) && a.TuNgay >= startDate && a.TuNgay <= endDate)
            .Select(a => new { a.TuNgay })
            .ToListAsync(cancellationToken);

        var hoatDongTheoThang = rawActivities
            .GroupBy(a => a.TuNgay.ToString("yyyy-MM"))
            .OrderBy(g => g.Key)
            .Select(g => new ActivityChartItem
            {
                TimeLabel = g.Key,
                Count = g.Count()
            })
            .ToList();

        // 6.3. Thi đua theo tổ chức
        var rawEmulations = await _context.ThiDuaCongDoans
            .Include(e => e.DonVi)
            .Include(e => e.DoanVien)
            .ThenInclude(d => d.ToCongDoan)
            .Where(e => ((e.DonViId.HasValue && filteredUnitIds.Contains(e.DonViId.Value)) ||
                         (e.DoanVienId.HasValue && e.DoanVien != null && filteredUnitIds.Contains(e.DoanVien.MaToCongDoan))) &&
                        e.Nam >= startDate.Year && e.Nam <= endDate.Year)
            .ToListAsync(cancellationToken);

        var thiDuaTheoToChuc = rawEmulations
            .GroupBy(e => e.DonViId.HasValue ? e.DonVi?.TenDonVi : e.DoanVien?.ToCongDoan?.TenDonVi)
            .Where(g => !string.IsNullOrEmpty(g.Key))
            .Select(g => new EmulationChartItem
            {
                OrganizationName = g.Key!,
                DatGiai = g.Count(e => e.XepLoai.Contains("XUAT_SAC") || e.XepLoai.Contains("TOT") || e.KhenThuong != null),
                DatYeuCau = g.Count(e => e.XepLoai.Contains("KHA") || e.XepLoai.Contains("TRUNG_BINH") || e.XepLoai == "HOAN_THANH"),
                ChuaDat = g.Count(e => e.XepLoai.Contains("YEU") || e.XepLoai.Contains("KHONG_HOAN_THANH"))
            })
            .ToList();

        return new UnionStatsDto
        {
            TongDoanVien = totalActive,
            DoanVienNam = maleCount,
            DoanVienNu = femaleCount,
            DoanVienDangSinhHoat = totalActive,
            DoanVienDangVien = dangVienCount,
            TiLeDangVien = totalActive > 0 ? Math.Round((double)dangVienCount / totalActive * 100, 1) : 0,
            TiLeNu = totalActive > 0 ? Math.Round((double)femaleCount / totalActive * 100, 1) : 0,

            TongCDBP = await _context.DonViCongDoans.CountAsync(u => filteredUnitIds.Contains(u.Id) && u.LoaiToChuc == LoaiToChuc.CDBP, cancellationToken),
            TongToCongDoan = await _context.DonViCongDoans.CountAsync(u => filteredUnitIds.Contains(u.Id) && (u.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || u.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS), cancellationToken),

            KetNapMoiThang = ketNapMoiThang,
            ChuyenDiThang = chuyenDiThang,
            NghiHuuThang = nghiHuuThang,

            DoanVienTheoCdbp = listCdbp,
            DoanVienTheoToCd = listToCd,
            DoanVienTheoKhoi = listKhoi,
            DoanVienTheoGioiTinh = listGioiTinh,
            DoanVienTheoTrangThai = listTrangThai,
            DoanVienTheoChatLuong = listChatLuong,
            DoanVienTheoChucVu = listChucVu,
            DoanVienTheoNgoaiNgu = listNgoaiNgu,
            DoanVienTheoTrinhDo = listTrinhDo,

            TongThuDoanPhi = tongThu,
            TongChi = tongChi,
            TonQuy = tongThu - tongChi,
            SoHoatDong = soHoatDong,
            SoLuotPhucLoi = soWelfare,
            SoSangKien = soInitiative,
            SoKetQuaThiDua = soEmulation,

            ThuChiTheoThoiGian = thuChiTheoThoiGian,
            HoatDongTheoThang = hoatDongTheoThang,
            ThiDuaTheoToChuc = thiDuaTheoToChuc
        };
    }

    private static string GetVaiTroName(VaiTroCongDoan vaiTro)
    {
        return vaiTro switch
        {
            VaiTroCongDoan.DoanVien => "Đoàn viên",
            VaiTroCongDoan.ToTruong => "Tổ trưởng",
            VaiTroCongDoan.ChuTichCDBP => "Chủ tịch CĐBP",
            VaiTroCongDoan.PhoChuTichCDBP => "Phó Chủ tịch CĐBP",
            VaiTroCongDoan.ChuTichCDCS => "Chủ tịch CĐCS",
            VaiTroCongDoan.PhoChuTichCDCS => "Phó Chủ tịch CĐCS",
            VaiTroCongDoan.UyVienBCH => "Ủy viên BCH",
            _ => vaiTro.ToString()
        };
    }
}

