using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Finance.Queries.GetFinance;

namespace QLCD.Application.Features.Finance.Queries.GetFinanceDetail;

public record GetFinanceDetailQuery : IRequest<FinanceDto?>
{
    public Guid Id { get; init; }
}

public class GetFinanceDetailQueryHandler : IRequestHandler<GetFinanceDetailQuery, FinanceDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetFinanceDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<FinanceDto?> Handle(GetFinanceDetailQuery request, CancellationToken cancellationToken)
    {
        var t = await _context.TaiChinhCongDoans
            .Include(x => x.DonVi)
            .Include(x => x.DoanVien)
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);

        if (t == null)
        {
            return null;
        }

        // Scope check
        if (!await _scopeService.IsInScopeAsync(t.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền truy cập giao dịch tài chính ngoài phạm vi quản lý.");
        }

        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiThuChi" || c.Loai == "LoaiDoanPhi")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var f = await _context.EvidenceFiles
            .Where(file => file.RelatedEntityId == t.Id && !file.IsDeleted)
            .OrderByDescending(file => file.UploadedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new FinanceDto
        {
            Id = t.Id,
            DonViId = t.DonViId,
            TenDonVi = t.DonVi != null ? t.DonVi.TenDonVi : "",
            LoaiGiaoDich = t.LoaiGiaoDich,
            TenLoaiGiaoDich = catalogs.TryGetValue(t.LoaiGiaoDich, out var name) ? name : t.LoaiGiaoDich,
            SoTien = t.SoTien,
            NgayGiaoDich = t.NgayGiaoDich,
            NguoiGiaoDich = t.NguoiGiaoDich,
            DoanVienId = t.DoanVienId,
            HoTenDoanVien = t.DoanVien != null ? t.DoanVien.HoTen : null,
            ThangNam = t.ThangNam,
            GhiChu = t.GhiChu,
            FileMinhChungUrl = f != null ? f.Id.ToString() : null,
            EvidenceFileId = f?.Id,
            EvidenceFileName = f?.OriginalFileName,
            EvidenceFileSize = f?.FileSize,
            DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
        };
    }
}
