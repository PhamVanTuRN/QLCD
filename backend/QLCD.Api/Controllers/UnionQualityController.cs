using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/union-quality")]
[Authorize]
public class UnionQualityController : ControllerBase
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUserService;

    public UnionQualityController(
        IQLCDDbContext context,
        IOrganizationScopeService scopeService,
        ICurrentUserService currentUserService)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUserService = currentUserService;
    }

    [HttpGet("periods")]
    public async Task<IActionResult> GetPeriods()
    {
        try
        {
            var periods = await _context.QualityEvaluationPeriods
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.Nam)
                .ThenBy(p => p.Ky)
                .ToListAsync();
            return Ok(new { success = true, data = periods });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi lấy kỳ đánh giá: " + ex.Message });
        }
    }

    [HttpGet("criteria")]
    public async Task<IActionResult> GetCriteria()
    {
        try
        {
            var criteria = await _context.QualityCriterias
                .Where(c => c.TrangThai && !c.IsDeleted)
                .OrderBy(c => c.ThuTu)
                .ToListAsync();
            return Ok(new { success = true, data = criteria });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi lấy bộ tiêu chí: " + ex.Message });
        }
    }

    [HttpGet("evaluation")]
    public async Task<IActionResult> GetEvaluation(
        [FromQuery] Guid organizationId,
        [FromQuery] int year,
        [FromQuery] string period)
    {
        try
        {
            if (!await _scopeService.IsInScopeAsync(organizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền truy cập dữ liệu đơn vị này." });
            }

            var periodRecord = await _context.QualityEvaluationPeriods
                .FirstOrDefaultAsync(p => p.Nam == year && p.Ky == period && !p.IsDeleted);
            if (periodRecord == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kỳ đánh giá được yêu cầu." });
            }

            var evaluation = await _context.QualityEvaluations
                .Include(e => e.Details)
                .ThenInclude(d => d.QualityCriteria)
                .FirstOrDefaultAsync(e => e.DonViCongDoanId == organizationId && e.QualityEvaluationPeriodId == periodRecord.Id && !e.IsDeleted);

            var summaryStats = await GetSummaryStatsAsync(organizationId, periodRecord.Id);

            if (evaluation == null)
            {
                return Ok(new 
                { 
                    success = true, 
                    data = (object?)null, 
                    summaryStats,
                    message = "Chưa có dữ liệu đánh giá chính thức." 
                });
            }

            // Map to clean response format
            var responseData = new
            {
                id = evaluation.Id,
                donViCongDoanId = evaluation.DonViCongDoanId,
                periodId = evaluation.QualityEvaluationPeriodId,
                tongDiem = evaluation.TongDiem,
                xepLoai = evaluation.XepLoai,
                datSoTieuChi = evaluation.DatSoTieuChi,
                tongSoTieuChi = evaluation.TongSoTieuChi,
                ngayDanhGia = evaluation.NgayDanhGia,
                nguoiDanhGia = evaluation.NguoiDanhGia,
                ghiChu = evaluation.GhiChu,
                details = evaluation.Details
                    .Where(d => !d.IsDeleted)
                    .OrderBy(d => d.QualityCriteria != null ? d.QualityCriteria.ThuTu : 0)
                    .Select(d => new
                    {
                        id = d.Id,
                        criteriaId = d.QualityCriteriaId,
                        ma = d.QualityCriteria?.Ma,
                        ten = d.QualityCriteria?.Ten,
                        phanLoai = d.QualityCriteria?.PhanLoai,
                        donViTinh = d.QualityCriteria?.DonViTinh,
                        mucTieu = d.MucTieu,
                        thucTe = d.ThucTe,
                        isPassed = d.IsPassed,
                        diemSo = d.DiemSo,
                        fileMinhChungUrl = d.FileMinhChungUrl,
                        ghiChu = d.GhiChu
                    }).ToList()
            };

            return Ok(new { success = true, data = responseData, summaryStats });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("manual-inputs")]
    public async Task<IActionResult> GetManualInputs(
        [FromQuery] Guid organizationId,
        [FromQuery] int year,
        [FromQuery] string period)
    {
        try
        {
            if (!await _scopeService.IsInScopeAsync(organizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền truy cập dữ liệu đơn vị này." });
            }

            var periodRecord = await _context.QualityEvaluationPeriods
                .FirstOrDefaultAsync(p => p.Nam == year && p.Ky == period && !p.IsDeleted);
            if (periodRecord == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kỳ đánh giá được yêu cầu." });
            }

            var manualInputs = await _context.QualityManualInputs
                .Include(m => m.QualityCriteria)
                .Where(m => m.DonViCongDoanId == organizationId && m.QualityEvaluationPeriodId == periodRecord.Id && !m.IsDeleted)
                .Select(m => new
                {
                    criteriaId = m.QualityCriteriaId,
                    criteriaMa = m.QualityCriteria != null ? m.QualityCriteria.Ma : "",
                    value = m.GiaTri
                }).ToListAsync();

            return Ok(new { success = true, data = manualInputs });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi lấy số liệu nhập tay: " + ex.Message });
        }
    }

    [HttpPost("manual-inputs")]
    public async Task<IActionResult> SaveManualInputs([FromBody] SaveManualInputsRequest request)
    {
        try
        {
            if (!await _scopeService.IsInScopeAsync(request.OrganizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền ghi dữ liệu cho đơn vị này." });
            }

            var periodRecord = await _context.QualityEvaluationPeriods
                .FirstOrDefaultAsync(p => p.Nam == request.Year && p.Ky == request.Period && !p.IsDeleted);
            if (periodRecord == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kỳ đánh giá." });
            }

            if (periodRecord.TrangThai == 2)
            {
                return BadRequest(new { success = false, message = "Kỳ đánh giá đã khóa chốt, không thể thay đổi dữ liệu." });
            }

            var allCriteria = await _context.QualityCriterias.Where(c => !c.IsDeleted).ToListAsync();

            foreach (var item in request.Inputs)
            {
                var criteria = allCriteria.FirstOrDefault(c => c.Ma == item.CriteriaMa);
                if (criteria == null) continue;

                var existing = await _context.QualityManualInputs
                    .FirstOrDefaultAsync(m => m.DonViCongDoanId == request.OrganizationId && 
                                              m.QualityEvaluationPeriodId == periodRecord.Id && 
                                              m.QualityCriteriaId == criteria.Id && 
                                              !m.IsDeleted);

                if (existing != null)
                {
                    existing.GiaTri = item.Value;
                    existing.NgayCapNhat = DateTime.Now;
                    existing.NguoiCapNhat = _currentUserService.Username;
                }
                else
                {
                    var newInput = new QualityManualInput
                    {
                        DonViCongDoanId = request.OrganizationId,
                        QualityEvaluationPeriodId = periodRecord.Id,
                        QualityCriteriaId = criteria.Id,
                        GiaTri = item.Value,
                        NgayCapNhat = DateTime.Now,
                        NguoiCapNhat = _currentUserService.Username
                    };
                    _context.QualityManualInputs.Add(newInput);
                }
            }

            await _context.SaveChangesAsync(default);
            return Ok(new { success = true, message = "Lưu số liệu nhập tay thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi lưu số liệu nhập tay: " + ex.Message });
        }
    }

    [HttpPost("calculate")]
    public async Task<IActionResult> Calculate([FromBody] CalculateRequest request)
    {
        try
        {
            if (!await _scopeService.IsInScopeAsync(request.OrganizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền truy cập đơn vị này." });
            }

            var periodRecord = await _context.QualityEvaluationPeriods
                .FirstOrDefaultAsync(p => p.Nam == request.Year && p.Ky == request.Period && !p.IsDeleted);
            if (periodRecord == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kỳ đánh giá." });
            }

            // Get sub-organization IDs for recursive queries
            var orgIds = await GetSubOrganizationIdsAsync(request.OrganizationId);

            // Set up date range for the period
            var (startDate, endDate) = GetPeriodDateRange(request.Year, request.Period);

            // Load all active criteria
            var allCriteria = await _context.QualityCriterias
                .Where(c => c.TrangThai && !c.IsDeleted)
                .OrderBy(c => c.ThuTu)
                .ToListAsync();

            // Load existing manual inputs in DB
            var dbManualInputs = await _context.QualityManualInputs
                .Include(m => m.QualityCriteria)
                .Where(m => m.DonViCongDoanId == request.OrganizationId && m.QualityEvaluationPeriodId == periodRecord.Id && !m.IsDeleted)
                .ToListAsync();

            // Merge with manual inputs from body if provided
            var mergedManualInputs = new List<ManualInputDto>();
            foreach (var crit in allCriteria)
            {
                var bodyInput = request.ManualInputs?.FirstOrDefault(m => m.CriteriaMa == crit.Ma);
                if (bodyInput != null)
                {
                    mergedManualInputs.Add(bodyInput);
                }
                else
                {
                    var dbInput = dbManualInputs.FirstOrDefault(m => m.QualityCriteria?.Ma == crit.Ma);
                    mergedManualInputs.Add(new ManualInputDto
                    {
                        CriteriaMa = crit.Ma,
                        Value = dbInput?.GiaTri ?? 0.0
                    });
                }
            }

            // Pre-fetch counts to optimize performance
            var activeMembers = await _context.DoanViens
                .Where(d => orgIds.Contains(d.MaToCongDoan) && d.TrangThai == TrangThaiDoanVien.DangSinhHoat && !d.IsDeleted)
                .ToListAsync();
            var totalActiveMembers = activeMembers.Count;

            var details = new List<object>();
            var datSoTieuChi = 0;
            var tongDiem = 0.0;

            foreach (var crit in allCriteria)
            {
                double thucTe = 0.0;

                switch (crit.Ma)
                {
                    case "Q1": // Tỉ lệ CNVCLĐ tham gia công đoàn
                        // Total members / Total employee count
                        var employeeCount = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == "Q1")?.Value ?? 0.0;
                        thucTe = employeeCount > 0 ? ((double)totalActiveMembers / employeeCount) * 100.0 : 100.0;
                        if (thucTe > 100.0) thucTe = 100.0; // Cap at 100%
                        break;

                    case "Q2": // Tỉ lệ thu đoàn phí đầy đủ
                        // Paid members in period / total active members
                        var paidMemberCount = await _context.TaiChinhCongDoans
                            .Where(t => t.DoanVienId != null && t.LoaiGiaoDich == "THU_DOAN_PHI" && orgIds.Contains(t.DonViId) && 
                                        t.NgayGiaoDich >= startDate && t.NgayGiaoDich <= endDate && !t.IsDeleted)
                            .Select(t => t.DoanVienId)
                            .Distinct()
                            .CountAsync();
                        thucTe = totalActiveMembers > 0 ? ((double)paidMemberCount / totalActiveMembers) * 100.0 : 100.0;
                        if (thucTe > 100.0) thucTe = 100.0;
                        break;

                    case "Q3": // Tỉ lệ đoàn viên là Đảng viên
                        var dangVienCount = activeMembers.Count(d => d.DangVien == "Đảng viên chính thức" || d.DangVien == "Đảng viên dự bị");
                        thucTe = totalActiveMembers > 0 ? ((double)dangVienCount / totalActiveMembers) * 100.0 : 0.0;
                        break;

                    case "Q4": // Tỉ lệ giới thiệu kết nạp Đảng
                        var partyIntroCount = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == "Q4")?.Value ?? 0.0;
                        thucTe = totalActiveMembers > 0 ? (partyIntroCount / totalActiveMembers) * 100.0 : 0.0;
                        if (thucTe > 100.0) thucTe = 100.0;
                        break;

                    case "Q5": // Tỉ lệ tham gia hoạt động phong trào
                        // Estimated based on activity counts in the period
                        var activitiesCount = await _context.HoatDongCongDoans
                            .CountAsync(a => orgIds.Contains(a.DonViId) && a.TuNgay >= startDate && a.TuNgay <= endDate && !a.IsDeleted);
                        thucTe = activitiesCount > 0 ? Math.Min(90.0 + activitiesCount * 2.5, 100.0) : 0.0;
                        break;

                    case "Q6": // Số sáng kiến được công nhận
                        thucTe = (double)await _context.SangKiens
                            .CountAsync(s => orgIds.Contains(s.DonViId) && s.TrangThai == 2 && 
                                             ((s.NgayNghiemThu != null && s.NgayNghiemThu >= startDate && s.NgayNghiemThu <= endDate) || 
                                              (s.NgayNghiemThu == null && s.NamThucHien == request.Year)) && !s.IsDeleted);
                        break;

                    case "Q7": // Tỉ lệ đoàn viên nữ tham gia BCH (manual)
                        thucTe = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == "Q7")?.Value ?? 0.0;
                        break;

                    case "Q8": // Số vụ vi phạm kỷ luật CĐ (manual)
                        thucTe = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == "Q8")?.Value ?? 0.0;
                        break;

                    case "Q9": // Tỉ lệ hoàn thành kế hoạch hoạt động
                        var periodActivities = await _context.HoatDongCongDoans
                            .Where(a => orgIds.Contains(a.DonViId) && a.TuNgay >= startDate && a.TuNgay <= endDate && !a.IsDeleted)
                            .ToListAsync();
                        var totalActivities = periodActivities.Count;
                        var successfulActivities = periodActivities.Count(a => !string.IsNullOrEmpty(a.KetQua));
                        thucTe = totalActivities > 0 ? ((double)successfulActivities / totalActivities) * 100.0 : 100.0;
                        break;

                    case "Q10": // Tỉ lệ đoàn viên đánh giá hài lòng (manual)
                        thucTe = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == "Q10")?.Value ?? 0.0;
                        break;

                    default:
                        // Read manual inputs if defined, else 0
                        thucTe = mergedManualInputs.FirstOrDefault(m => m.CriteriaMa == crit.Ma)?.Value ?? 0.0;
                        break;
                }

                // Check pass status
                bool isPassed = crit.IsInverse ? thucTe <= crit.MucTieu : thucTe >= crit.MucTieu;
                if (isPassed) datSoTieuChi++;

                // Score criteria (out of 10)
                double diem = CalculateCriteriaScore(thucTe, crit.MucTieu, crit.IsInverse);
                tongDiem += diem;

                // Format values for JSON response
                details.Add(new
                {
                    criteriaId = crit.Id,
                    ma = crit.Ma,
                    ten = crit.Ten,
                    phanLoai = crit.PhanLoai,
                    donViTinh = crit.DonViTinh,
                    mucTieu = crit.MucTieu,
                    thucTe = Math.Round(thucTe, 1),
                    isPassed = isPassed,
                    diemSo = Math.Round(diem, 1)
                });
            }

            // Xếp loại quy tắc:
            // - Xuất sắc: Đạt >= 9/10 tiêu chí và tổng điểm >= 90.0
            // - Vững mạnh: Đạt >= 7/10 tiêu chí và tổng điểm >= 80.0
            // - Hoàn thành tốt: Đạt >= 5/10 tiêu chí và tổng điểm >= 65.0
            // - Chưa hoàn thành: còn lại
            string xepLoai = "Chưa hoàn thành";
            if (datSoTieuChi >= 9 && tongDiem >= 90.0) xepLoai = "Xuất sắc";
            else if (datSoTieuChi >= 7 && tongDiem >= 80.0) xepLoai = "Vững mạnh";
            else if (datSoTieuChi >= 5 && tongDiem >= 65.0) xepLoai = "Hoàn thành tốt";

            var summaryStats = await GetSummaryStatsAsync(request.OrganizationId, periodRecord.Id);

            var draftEvaluation = new
            {
                donViCongDoanId = request.OrganizationId,
                periodId = periodRecord.Id,
                tongDiem = Math.Round(tongDiem, 1),
                xepLoai = xepLoai,
                datSoTieuChi = datSoTieuChi,
                tongSoTieuChi = allCriteria.Count,
                ngayDanhGia = DateTime.Now,
                nguoiDanhGia = _currentUserService.Username,
                details = details
            };

            return Ok(new { success = true, data = draftEvaluation, summaryStats });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi tính toán số liệu: " + ex.Message });
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveEvaluation([FromBody] SaveEvaluationRequest request)
    {
        try
        {
            if (!await _scopeService.IsInScopeAsync(request.OrganizationId))
            {
                return StatusCode(403, new { success = false, message = "Không có quyền chốt đánh giá cho đơn vị này." });
            }

            var periodRecord = await _context.QualityEvaluationPeriods
                .FirstOrDefaultAsync(p => p.Nam == request.Year && p.Ky == request.Period && !p.IsDeleted);
            if (periodRecord == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy kỳ đánh giá." });
            }

            if (periodRecord.TrangThai == 2)
            {
                return BadRequest(new { success = false, message = "Kỳ đánh giá đã khóa chốt, không thể cập nhật kết quả." });
            }

            // Check if evaluation already exists
            var existingEvaluation = await _context.QualityEvaluations
                .Include(e => e.Details)
                .FirstOrDefaultAsync(e => e.DonViCongDoanId == request.OrganizationId && 
                                          e.QualityEvaluationPeriodId == periodRecord.Id && 
                                          !e.IsDeleted);

            if (existingEvaluation != null)
            {
                existingEvaluation.TongDiem = request.TongDiem;
                existingEvaluation.XepLoai = request.XepLoai;
                existingEvaluation.DatSoTieuChi = request.DatSoTieuChi;
                existingEvaluation.TongSoTieuChi = request.TongSoTieuChi;
                existingEvaluation.NguoiDanhGia = _currentUserService.Username;
                existingEvaluation.NgayDanhGia = DateTime.Now;
                existingEvaluation.GhiChu = request.GhiChu;

                // Update detail records
                foreach (var detailDto in request.Details)
                {
                    var existingDetail = existingEvaluation.Details
                        .FirstOrDefault(d => d.QualityCriteriaId == detailDto.CriteriaId && !d.IsDeleted);

                    if (existingDetail != null)
                    {
                        existingDetail.MucTieu = detailDto.MucTieu;
                        existingDetail.ThucTe = detailDto.ThucTe;
                        existingDetail.IsPassed = detailDto.IsPassed;
                        existingDetail.DiemSo = detailDto.DiemSo;
                        existingDetail.FileMinhChungUrl = detailDto.FileMinhChungUrl;
                        existingDetail.GhiChu = detailDto.GhiChu;
                    }
                    else
                    {
                        var newDetail = new QualityEvaluationDetail
                        {
                            QualityEvaluationId = existingEvaluation.Id,
                            QualityCriteriaId = detailDto.CriteriaId,
                            MucTieu = detailDto.MucTieu,
                            ThucTe = detailDto.ThucTe,
                            IsPassed = detailDto.IsPassed,
                            DiemSo = detailDto.DiemSo,
                            FileMinhChungUrl = detailDto.FileMinhChungUrl,
                            GhiChu = detailDto.GhiChu
                        };
                        _context.QualityEvaluationDetails.Add(newDetail);
                    }
                }
            }
            else
            {
                var newEvaluation = new QualityEvaluation
                {
                    DonViCongDoanId = request.OrganizationId,
                    QualityEvaluationPeriodId = periodRecord.Id,
                    TongDiem = request.TongDiem,
                    XepLoai = request.XepLoai,
                    DatSoTieuChi = request.DatSoTieuChi,
                    TongSoTieuChi = request.TongSoTieuChi,
                    NguoiDanhGia = _currentUserService.Username,
                    NgayDanhGia = DateTime.Now,
                    GhiChu = request.GhiChu
                };

                _context.QualityEvaluations.Add(newEvaluation);

                foreach (var detailDto in request.Details)
                {
                    var newDetail = new QualityEvaluationDetail
                    {
                        QualityEvaluationId = newEvaluation.Id,
                        QualityCriteriaId = detailDto.CriteriaId,
                        MucTieu = detailDto.MucTieu,
                        ThucTe = detailDto.ThucTe,
                        IsPassed = detailDto.IsPassed,
                        DiemSo = detailDto.DiemSo,
                        FileMinhChungUrl = detailDto.FileMinhChungUrl,
                        GhiChu = detailDto.GhiChu
                    };
                    _context.QualityEvaluationDetails.Add(newDetail);
                }
            }

            await _context.SaveChangesAsync(default);
            return Ok(new { success = true, message = "Lưu kết quả đánh giá thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi khi lưu kết quả đánh giá: " + ex.Message });
        }
    }

    #region Helper Methods

    private double CalculateCriteriaScore(double actual, double target, bool isInverse)
    {
        if (isInverse)
        {
            if (target == 0)
            {
                return Math.Max(10.0 - actual * 2.0, 0.0);
            }
            else
            {
                return actual <= target ? 10.0 : Math.Max(10.0 - (actual - target) * 2.0, 0.0);
            }
        }
        else
        {
            if (target <= 0) return 10.0;
            var ratio = actual / target;
            return Math.Min(ratio * 10.0, 10.0);
        }
    }

    private async Task<List<Guid>> GetSubOrganizationIdsAsync(Guid organizationId)
    {
        var list = new List<Guid> { organizationId };
        var allOrgs = await _context.DonViCongDoans.Where(o => !o.IsDeleted).ToListAsync();

        void GetChildren(Guid parentId)
        {
            var children = allOrgs.Where(o => o.MaParent == parentId).Select(o => o.Id).ToList();
            foreach (var childId in children)
            {
                if (!list.Contains(childId))
                {
                    list.Add(childId);
                    GetChildren(childId);
                }
            }
        }

        GetChildren(organizationId);
        return list;
    }

    private (DateTime StartDate, DateTime EndDate) GetPeriodDateRange(int year, string period)
    {
        switch (period.ToUpper())
        {
            case "Q1":
                return (new DateTime(year, 1, 1), new DateTime(year, 3, 31, 23, 59, 59));
            case "Q2":
                return (new DateTime(year, 4, 1), new DateTime(year, 6, 30, 23, 59, 59));
            case "Q3":
                return (new DateTime(year, 7, 1), new DateTime(year, 9, 30, 23, 59, 59));
            case "Q4":
                return (new DateTime(year, 10, 1), new DateTime(year, 12, 31, 23, 59, 59));
            case "YEAR":
            default:
                return (new DateTime(year, 1, 1), new DateTime(year, 12, 31, 23, 59, 59));
        }
    }

    private async Task<object> GetSummaryStatsAsync(Guid organizationId, Guid periodId)
    {
        var childOrgs = await _context.DonViCongDoans
            .Where(o => o.MaParent == organizationId && !o.IsDeleted)
            .ToListAsync();
        
        var childOrgIds = childOrgs.Select(o => o.Id).ToList();

        var childEvaluations = await _context.QualityEvaluations
            .Where(e => childOrgIds.Contains(e.DonViCongDoanId) && e.QualityEvaluationPeriodId == periodId && !e.IsDeleted)
            .ToListAsync();

        int childOrgCount = childOrgIds.Count;
        int evaluatedCount = childEvaluations.Count;
        int excellentCount = childEvaluations.Count(e => e.XepLoai == "Xuất sắc");
        int strongCount = childEvaluations.Count(e => e.XepLoai == "Vững mạnh");
        int goodCount = childEvaluations.Count(e => e.XepLoai == "Hoàn thành tốt");
        int unfinishedCount = childEvaluations.Count(e => e.XepLoai == "Chưa hoàn thành");

        return new
        {
            subUnitsTotal = childOrgCount,
            subUnitsEvaluated = evaluatedCount,
            subUnitsExcellent = excellentCount,
            subUnitsStrong = strongCount,
            subUnitsGood = goodCount,
            subUnitsUnfinished = unfinishedCount
        };
    }

    #endregion
}

public class SaveManualInputsRequest
{
    public Guid OrganizationId { get; set; }
    public int Year { get; set; }
    public string Period { get; set; } = null!;
    public List<ManualInputDto> Inputs { get; set; } = new();
}

public class CalculateRequest
{
    public Guid OrganizationId { get; set; }
    public int Year { get; set; }
    public string Period { get; set; } = null!;
    public List<ManualInputDto>? ManualInputs { get; set; }
}

public class ManualInputDto
{
    public string CriteriaMa { get; set; } = null!;
    public double Value { get; set; }
}

public class SaveEvaluationRequest
{
    public Guid OrganizationId { get; set; }
    public int Year { get; set; }
    public string Period { get; set; } = null!;
    public double TongDiem { get; set; }
    public string XepLoai { get; set; } = null!;
    public int DatSoTieuChi { get; set; }
    public int TongSoTieuChi { get; set; }
    public string? GhiChu { get; set; }
    public List<EvaluationDetailDto> Details { get; set; } = new();
}

public class EvaluationDetailDto
{
    public Guid CriteriaId { get; set; }
    public string CriteriaMa { get; set; } = null!;
    public double MucTieu { get; set; }
    public double ThucTe { get; set; }
    public bool IsPassed { get; set; }
    public double DiemSo { get; set; }
    public string? FileMinhChungUrl { get; set; }
    public string? GhiChu { get; set; }
}
