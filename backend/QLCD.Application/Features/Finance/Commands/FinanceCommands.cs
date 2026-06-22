using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Finance.Commands;

// ==================== CREATE ====================
public record CreateFinanceCommand : IRequest<Guid>
{
    public Guid DonViId { get; init; }
    public required string LoaiGiaoDich { get; init; }
    public decimal SoTien { get; init; }
    public DateTime NgayGiaoDich { get; init; }
    public required string NguoiGiaoDich { get; init; }
    public Guid? DoanVienId { get; init; }
    public string? ThangNam { get; init; }
    public string? GhiChu { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateFinanceCommandHandler : IRequestHandler<CreateFinanceCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public CreateFinanceCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<Guid> Handle(CreateFinanceCommand request, CancellationToken cancellationToken)
    {
        // Scope Validation
        if (!await _scopeService.IsInScopeAsync(request.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền ghi nhận giao dịch ngoài phạm vi quản lý.");
        }

        var transaction = new TaiChinhCongDoan
        {
            DonViId = request.DonViId,
            LoaiGiaoDich = request.LoaiGiaoDich,
            SoTien = request.SoTien,
            NgayGiaoDich = request.NgayGiaoDich,
            NguoiGiaoDich = request.NguoiGiaoDich,
            DoanVienId = request.DoanVienId,
            ThangNam = request.ThangNam,
            GhiChu = request.GhiChu
        };

        _context.TaiChinhCongDoans.Add(transaction);
        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = transaction.Id;
                file.OrganizationId = transaction.DonViId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return transaction.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateFinanceCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DonViId { get; init; }
    public required string LoaiGiaoDich { get; init; }
    public decimal SoTien { get; init; }
    public DateTime NgayGiaoDich { get; init; }
    public required string NguoiGiaoDich { get; init; }
    public Guid? DoanVienId { get; init; }
    public string? ThangNam { get; init; }
    public string? GhiChu { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateFinanceCommandHandler : IRequestHandler<UpdateFinanceCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public UpdateFinanceCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<bool> Handle(UpdateFinanceCommand request, CancellationToken cancellationToken)
    {
        var trans = await _context.TaiChinhCongDoans
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (trans == null)
        {
            throw new ArgumentException("Giao dịch không tồn tại.");
        }

        // Scope Validation
        if (!await _scopeService.IsInScopeAsync(trans.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa giao dịch ngoài phạm vi quản lý.");
        }

        if (!await _scopeService.IsInScopeAsync(request.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển giao dịch sang đơn vị ngoài phạm vi quản lý.");
        }

        trans.DonViId = request.DonViId;
        trans.LoaiGiaoDich = request.LoaiGiaoDich;
        trans.SoTien = request.SoTien;
        trans.NgayGiaoDich = request.NgayGiaoDich;
        trans.NguoiGiaoDich = request.NguoiGiaoDich;
        trans.DoanVienId = request.DoanVienId;
        trans.ThangNam = request.ThangNam;
        trans.GhiChu = request.GhiChu;

        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = trans.Id;
                file.OrganizationId = trans.DonViId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteFinanceCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class DeleteFinanceCommandHandler : IRequestHandler<DeleteFinanceCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public DeleteFinanceCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<bool> Handle(DeleteFinanceCommand request, CancellationToken cancellationToken)
    {
        var trans = await _context.TaiChinhCongDoans
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
        if (trans == null)
        {
            throw new ArgumentException("Giao dịch không tồn tại.");
        }

        // Scope Validation
        if (!await _scopeService.IsInScopeAsync(trans.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa giao dịch này.");
        }

        trans.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
