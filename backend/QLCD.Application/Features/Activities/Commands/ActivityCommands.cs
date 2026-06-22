using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Activities.Commands;

// ==================== CREATE ====================
public record CreateActivityCommand : IRequest<Guid>
{
    public Guid DonViId { get; init; }
    public required string TenHoatDong { get; init; }
    public string? MoTa { get; init; }
    public required string LoaiHoatDong { get; init; }
    public DateTime TuNgay { get; init; }
    public DateTime DenNgay { get; init; }
    public required string DiaDiem { get; init; }
    public string? MaQRCode { get; init; }
    public decimal KinhPhi { get; init; }
    public string? KetQua { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context scope validation
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateActivityCommandHandler : IRequestHandler<CreateActivityCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public CreateActivityCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<Guid> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        if (!await _scopeService.IsInScopeAsync(request.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền tạo hoạt động ngoài phạm vi đơn vị quản lý.");
        }

        var activity = new HoatDongCongDoan
        {
            DonViId = request.DonViId,
            TenHoatDong = request.TenHoatDong,
            MoTa = request.MoTa,
            LoaiHoatDong = request.LoaiHoatDong,
            TuNgay = request.TuNgay,
            DenNgay = request.DenNgay,
            DiaDiem = request.DiaDiem,
            MaQRCode = request.MaQRCode,
            KinhPhi = request.KinhPhi,
            KetQua = request.KetQua,
            FileMinhChungUrl = request.FileMinhChungUrl
        };

        _context.HoatDongCongDoans.Add(activity);
        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = activity.Id;
                file.OrganizationId = activity.DonViId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return activity.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateActivityCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DonViId { get; init; }
    public required string TenHoatDong { get; init; }
    public string? MoTa { get; init; }
    public required string LoaiHoatDong { get; init; }
    public DateTime TuNgay { get; init; }
    public DateTime DenNgay { get; init; }
    public required string DiaDiem { get; init; }
    public string? MaQRCode { get; init; }
    public decimal KinhPhi { get; init; }
    public string? KetQua { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context scope validation
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateActivityCommandHandler : IRequestHandler<UpdateActivityCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public UpdateActivityCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<bool> Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await _context.HoatDongCongDoans
            .FirstOrDefaultAsync(h => h.Id == request.Id, cancellationToken);
        if (activity == null)
        {
            throw new ArgumentException("Hoạt động không tồn tại.");
        }

        if (!await _scopeService.IsInScopeAsync(activity.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa hoạt động ngoài phạm vi quản lý.");
        }

        if (!await _scopeService.IsInScopeAsync(request.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển hoạt động sang đơn vị ngoài phạm vi quản lý.");
        }

        activity.DonViId = request.DonViId;
        activity.TenHoatDong = request.TenHoatDong;
        activity.MoTa = request.MoTa;
        activity.LoaiHoatDong = request.LoaiHoatDong;
        activity.TuNgay = request.TuNgay;
        activity.DenNgay = request.DenNgay;
        activity.DiaDiem = request.DiaDiem;
        activity.MaQRCode = request.MaQRCode;
        activity.KinhPhi = request.KinhPhi;
        activity.KetQua = request.KetQua;
        activity.FileMinhChungUrl = request.FileMinhChungUrl;

        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = activity.Id;
                file.OrganizationId = activity.DonViId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteActivityCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    // Auth context scope validation
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class DeleteActivityCommandHandler : IRequestHandler<DeleteActivityCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public DeleteActivityCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<bool> Handle(DeleteActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await _context.HoatDongCongDoans
            .FirstOrDefaultAsync(h => h.Id == request.Id, cancellationToken);
        if (activity == null)
        {
            throw new ArgumentException("Hoạt động không tồn tại.");
        }

        if (!await _scopeService.IsInScopeAsync(activity.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa hoạt động này.");
        }

        activity.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
