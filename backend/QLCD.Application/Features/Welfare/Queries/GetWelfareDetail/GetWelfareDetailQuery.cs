using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Welfare.Queries.GetWelfare;

namespace QLCD.Application.Features.Welfare.Queries.GetWelfareDetail;

public record GetWelfareDetailQuery : IRequest<WelfareDto?>
{
    public Guid Id { get; init; }
}

public class GetWelfareDetailQueryHandler : IRequestHandler<GetWelfareDetailQuery, WelfareDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetWelfareDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<WelfareDto?> Handle(GetWelfareDetailQuery request, CancellationToken cancellationToken)
    {
        var w = await _context.PhucLoiDoanViens
            .Include(x => x.DonVi)
            .Include(x => x.DoanVien)
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);

        if (w == null)
        {
            return null;
        }

        // Scope check
        if (!await _scopeService.IsInScopeAsync(w.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền truy cập phúc lợi đoàn viên ngoài phạm vi quản lý.");
        }

        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "HinhThucPhucLoi")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var f = await _context.EvidenceFiles
            .Where(file => file.RelatedEntityId == w.Id && !file.IsDeleted)
            .OrderByDescending(file => file.UploadedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new WelfareDto
        {
            Id = w.Id,
            DoanVienId = w.DoanVienId,
            HoTenDoanVien = w.DoanVien != null ? w.DoanVien.HoTen : "",
            MaNhanVien = w.DoanVien != null ? w.DoanVien.MaNhanVien : "",
            DonViId = w.DonViId,
            TenDonVi = w.DonVi != null ? w.DonVi.TenDonVi : "",
            LoaiPhucLoi = w.LoaiPhucLoi,
            TenLoaiPhucLoi = catalogs.TryGetValue(w.LoaiPhucLoi, out var name) ? name : w.LoaiPhucLoi,
            KinhPhiHoTro = w.KinhPhiHoTro,
            NgayHoTro = w.NgayHoTro,
            LyDo = w.LyDo,
            TrangThai = w.TrangThai,
            FileMinhChungUrl = w.FileMinhChungUrl,
            EvidenceFileId = f?.Id,
            EvidenceFileName = f?.OriginalFileName,
            EvidenceFileSize = f?.FileSize,
            DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
        };
    }
}
