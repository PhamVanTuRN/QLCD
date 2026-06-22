using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Activities.Queries.GetActivities;

namespace QLCD.Application.Features.Activities.Queries.GetActivityDetail;

public record GetActivityDetailQuery : IRequest<ActivityDto?>
{
    public Guid Id { get; init; }
}

public class GetActivityDetailQueryHandler : IRequestHandler<GetActivityDetailQuery, ActivityDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetActivityDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<ActivityDto?> Handle(GetActivityDetailQuery request, CancellationToken cancellationToken)
    {
        var h = await _context.HoatDongCongDoans
            .Include(x => x.DonVi)
            .FirstOrDefaultAsync(x => x.Id == request.Id && !x.IsDeleted, cancellationToken);

        if (h == null)
        {
            return null;
        }

        // Scope check
        if (!await _scopeService.IsInScopeAsync(h.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền truy cập hoạt động ngoài phạm vi quản lý.");
        }

        var catalogs = await _context.DanhMucDungChungs
            .Where(c => c.Loai == "LoaiHoatDong")
            .ToDictionaryAsync(c => c.Ma, c => c.Ten, cancellationToken);

        var f = await _context.EvidenceFiles
            .Where(file => file.RelatedEntityId == h.Id && !file.IsDeleted)
            .OrderByDescending(file => file.UploadedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new ActivityDto
        {
            Id = h.Id,
            DonViId = h.DonViId,
            TenDonVi = h.DonVi != null ? h.DonVi.TenDonVi : "",
            TenHoatDong = h.TenHoatDong,
            MoTa = h.MoTa,
            LoaiHoatDong = h.LoaiHoatDong,
            TenLoaiHoatDong = catalogs.TryGetValue(h.LoaiHoatDong, out var name) ? name : h.LoaiHoatDong,
            TuNgay = h.TuNgay,
            DenNgay = h.DenNgay,
            DiaDiem = h.DiaDiem,
            MaQRCode = h.MaQRCode,
            KinhPhi = h.KinhPhi,
            KetQua = h.KetQua,
            FileMinhChungUrl = h.FileMinhChungUrl,
            EvidenceFileId = f?.Id,
            EvidenceFileName = f?.OriginalFileName,
            EvidenceFileSize = f?.FileSize,
            DownloadUrl = f != null ? $"/api/v1/evidence-files/download/{f.Id}" : null
        };
    }
}
