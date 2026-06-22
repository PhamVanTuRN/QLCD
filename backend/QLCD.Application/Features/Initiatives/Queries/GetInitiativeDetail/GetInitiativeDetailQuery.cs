using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Initiatives.Queries.GetInitiatives;

namespace QLCD.Application.Features.Initiatives.Queries.GetInitiativeDetail;

public record GetInitiativeDetailQuery : IRequest<InitiativeDto?>
{
    public Guid Id { get; init; }
}

public class GetInitiativeDetailQueryHandler : IRequestHandler<GetInitiativeDetailQuery, InitiativeDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetInitiativeDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<InitiativeDto?> Handle(GetInitiativeDetailQuery request, CancellationToken cancellationToken)
    {
        var i = await _context.SangKiens
            .Include(x => x.DonVi)
            .Include(x => x.DoanVien)
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);

        if (i == null)
        {
            return null;
        }

        // Scope check
        if (!await _scopeService.IsInScopeAsync(i.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền truy cập đề tài sáng kiến ngoài phạm vi quản lý.");
        }

        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiSangKien")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var f = await _context.EvidenceFiles
            .Where(file => file.RelatedEntityId == i.Id && !file.IsDeleted)
            .OrderByDescending(file => file.UploadedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new InitiativeDto
        {
            Id = i.Id,
            DoanVienId = i.DoanVienId,
            HoTenDoanVien = i.DoanVien != null ? i.DoanVien.HoTen : "",
            MaNhanVien = i.DoanVien != null ? i.DoanVien.MaNhanVien : "",
            DonViId = i.DonViId,
            TenDonVi = i.DonVi != null ? i.DonVi.TenDonVi : "",
            TenDeTai = i.TenDeTai,
            LinhVuc = i.LinhVuc,
            CapDeTai = i.CapDeTai,
            TenCapDeTai = catalogs.TryGetValue(i.CapDeTai, out var name) ? name : i.CapDeTai,
            HieuQuaKinhTe = i.HieuQuaKinhTe,
            NgayNghiemThu = i.NgayNghiemThu,
            NamThucHien = i.NamThucHien,
            KetQuaNghiemThu = i.KetQuaNghiemThu,
            TrangThai = i.TrangThai,
            FileMinhChungUrl = f != null ? f.Id.ToString() : null,
            EvidenceFileId = f?.Id,
            EvidenceFileName = f?.OriginalFileName,
            EvidenceFileSize = f?.FileSize,
            DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
        };
    }
}
