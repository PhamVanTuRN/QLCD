using System.ComponentModel.DataAnnotations;
using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Security;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Activities.Commands;

// ==================== CREATE ====================
public record CreateActivityCommand : IRequest<Guid>
{
    public Guid DonViId { get; init; }
    [Required, StringLength(250)]
    public required string TenHoatDong { get; init; }
    [StringLength(1000)]
    public string? MoTa { get; init; }
    [Required, StringLength(50)]
    public required string LoaiHoatDong { get; init; }
    public DateTime TuNgay { get; init; }
    public DateTime DenNgay { get; init; }
    [Required, StringLength(250)]
    public required string DiaDiem { get; init; }
    [StringLength(100)]
    public string? MaQRCode { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal KinhPhi { get; init; }
    [StringLength(1000)]
    public string? KetQua { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class CreateActivityCommandHandler : IRequestHandler<CreateActivityCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;

    public CreateActivityCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
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
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Activities", activity.Id, activity.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return activity.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateActivityCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DonViId { get; init; }
    [Required, StringLength(250)]
    public required string TenHoatDong { get; init; }
    [StringLength(1000)]
    public string? MoTa { get; init; }
    [Required, StringLength(50)]
    public required string LoaiHoatDong { get; init; }
    public DateTime TuNgay { get; init; }
    public DateTime DenNgay { get; init; }
    [Required, StringLength(250)]
    public required string DiaDiem { get; init; }
    [StringLength(100)]
    public string? MaQRCode { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal KinhPhi { get; init; }
    [StringLength(1000)]
    public string? KetQua { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class UpdateActivityCommandHandler : IRequestHandler<UpdateActivityCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;

    public UpdateActivityCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
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

        await _evidence.AttachAsync(request.FileMinhChungUrl, "Activities", activity.Id, activity.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteActivityCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
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
