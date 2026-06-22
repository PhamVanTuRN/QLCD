using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Emulations.Queries.GetEmulations;

namespace QLCD.Application.Features.Emulations.Queries.GetEmulationDetail;

public record GetEmulationDetailQuery : IRequest<EmulationDto?>
{
    public Guid Id { get; init; }
}

public class GetEmulationDetailQueryHandler : IRequestHandler<GetEmulationDetailQuery, EmulationDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetEmulationDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<EmulationDto?> Handle(GetEmulationDetailQuery request, CancellationToken cancellationToken)
    {
        var e = await _context.ThiDuaCongDoans
            .Include(x => x.DonVi)
            .Include(x => x.DoanVien)
                .ThenInclude(dv => dv.ToCongDoan)
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);

        if (e == null)
        {
            return null;
        }

        // Scope check: either e.DonViId or e.DoanVien.MaToCongDoan must be in scope
        Guid checkOrgId = Guid.Empty;
        if (e.DonViId.HasValue)
        {
            checkOrgId = e.DonViId.Value;
        }
        else if (e.DoanVien != null)
        {
            checkOrgId = e.DoanVien.MaToCongDoan;
        }

        if (checkOrgId != Guid.Empty && !await _scopeService.IsInScopeAsync(checkOrgId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền truy cập thi đua ngoài phạm vi quản lý.");
        }

        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "ChatLuongDoanVien")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var f = await _context.EvidenceFiles
            .Where(file => file.RelatedEntityId == e.Id && !file.IsDeleted)
            .OrderByDescending(file => file.UploadedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new EmulationDto
        {
            Id = e.Id,
            TenPhongTrao = e.TenPhongTrao,
            DoanVienId = e.DoanVienId,
            HoTenDoanVien = e.DoanVien != null ? e.DoanVien.HoTen : null,
            MaNhanVien = e.DoanVien != null ? e.DoanVien.MaNhanVien : null,
            DonViId = e.DonViId,
            TenDonVi = e.DonVi != null ? e.DonVi.TenDonVi : (e.DoanVien != null && e.DoanVien.ToCongDoan != null ? e.DoanVien.ToCongDoan.TenDonVi : ""),
            Nam = e.Nam,
            DiemTuDanhGia = e.DiemTuDanhGia,
            DiemBchDuyet = e.DiemBchDuyet,
            XepLoai = e.XepLoai,
            TenXepLoai = catalogs.TryGetValue(e.XepLoai, out var name) ? name : e.XepLoai,
            KhenThuong = e.KhenThuong,
            TrangThai = e.TrangThai,
            FileMinhChungUrl = f != null ? f.Id.ToString() : null,
            EvidenceFileId = f?.Id,
            EvidenceFileName = f?.OriginalFileName,
            EvidenceFileSize = f?.FileSize,
            DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
        };
    }
}
