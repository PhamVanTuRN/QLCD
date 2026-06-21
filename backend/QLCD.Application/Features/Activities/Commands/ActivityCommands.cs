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

    public CreateActivityCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        // Phân quyền tạo
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                if (request.UserRole == "CDBP")
                {
                    // Chỉ được tạo cho đơn vị mình hoặc con trực thuộc
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    if (request.DonViId != orgId && !childOrgIds.Contains(request.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền tạo hoạt động ngoài phạm vi đơn vị quản lý.");
                    }
                }
                else // TOCD
                {
                    if (request.DonViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền tạo hoạt động ngoài phạm vi tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Thông tin đơn vị quản lý không hợp lệ.");
            }
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

    public UpdateActivityCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await _context.HoatDongCongDoans
            .FirstOrDefaultAsync(h => h.Id == request.Id, cancellationToken);
        if (activity == null)
        {
            throw new ArgumentException("Hoạt động không tồn tại.");
        }

        // Phân quyền sửa
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                if (request.UserRole == "CDBP")
                {
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    if (activity.DonViId != orgId && !childOrgIds.Contains(activity.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa hoạt động ngoài phạm vi quản lý.");
                    }
                    if (request.DonViId != orgId && !childOrgIds.Contains(request.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chuyển hoạt động ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (activity.DonViId != orgId || request.DonViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa hoạt động ngoài phạm vi tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Quyền truy cập không hợp lệ.");
            }
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

    public DeleteActivityCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await _context.HoatDongCongDoans
            .FirstOrDefaultAsync(h => h.Id == request.Id, cancellationToken);
        if (activity == null)
        {
            throw new ArgumentException("Hoạt động không tồn tại.");
        }

        // Phân quyền xóa
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                if (request.UserRole == "CDBP")
                {
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    if (activity.DonViId != orgId && !childOrgIds.Contains(activity.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa hoạt động này.");
                    }
                }
                else // TOCD
                {
                    if (activity.DonViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa hoạt động ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Quyền truy cập không hợp lệ.");
            }
        }

        activity.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
