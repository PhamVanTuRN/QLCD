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

namespace QLCD.Application.Features.Finance.Commands;

// ==================== CREATE ====================
public record CreateFinanceCommand : IRequest<Guid>
{
    public Guid DonViId { get; init; }
    [Required, StringLength(50)]
    public required string LoaiGiaoDich { get; init; }
    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    public decimal SoTien { get; init; }
    public DateTime NgayGiaoDich { get; init; }
    [Required, StringLength(100)]
    public required string NguoiGiaoDich { get; init; }
    public Guid? DoanVienId { get; init; }
    [StringLength(7)]
    public string? ThangNam { get; init; }
    [StringLength(500)]
    public string? GhiChu { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class CreateFinanceCommandHandler : IRequestHandler<CreateFinanceCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public CreateFinanceCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateFinanceCommand request, CancellationToken cancellationToken)
    {
        // Scope Validation
        if (!await _scopeService.IsInScopeAsync(request.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền ghi nhận giao dịch ngoài phạm vi quản lý.");
        }

        if (_currentUser.Role is not (SecurityRoles.Central or SecurityRoles.Department or SecurityRoles.Team)
            || (_currentUser.Role == SecurityRoles.Team && (request.LoaiGiaoDich != "THU_DOAN_PHI")))
            throw new UnauthorizedAccessException("Finance operation not permitted.");

        if (request.DoanVienId is Guid memberId && !await _context.DoanViens.AnyAsync(
            member => member.Id == memberId && member.MaToCongDoan == request.DonViId, cancellationToken))
            throw new ArgumentException("The member must belong to the transaction unit.");

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
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Finance", transaction.Id, transaction.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return transaction.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateFinanceCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DonViId { get; init; }
    [Required, StringLength(50)]
    public required string LoaiGiaoDich { get; init; }
    [Range(typeof(decimal), "0.01", "9999999999999999.99")]
    public decimal SoTien { get; init; }
    public DateTime NgayGiaoDich { get; init; }
    [Required, StringLength(100)]
    public required string NguoiGiaoDich { get; init; }
    public Guid? DoanVienId { get; init; }
    [StringLength(7)]
    public string? ThangNam { get; init; }
    [StringLength(500)]
    public string? GhiChu { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class UpdateFinanceCommandHandler : IRequestHandler<UpdateFinanceCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public UpdateFinanceCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
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

        if (_currentUser.Role is not (SecurityRoles.Central or SecurityRoles.Department or SecurityRoles.Team)
            || (_currentUser.Role == SecurityRoles.Team && (request.LoaiGiaoDich != "THU_DOAN_PHI" || trans.LoaiGiaoDich != "THU_DOAN_PHI")))
            throw new UnauthorizedAccessException("Finance operation not permitted.");

        if (request.DoanVienId is Guid memberId && !await _context.DoanViens.AnyAsync(
            member => member.Id == memberId && member.MaToCongDoan == request.DonViId, cancellationToken))
            throw new ArgumentException("The member must belong to the transaction unit.");

        trans.DonViId = request.DonViId;
        trans.LoaiGiaoDich = request.LoaiGiaoDich;
        trans.SoTien = request.SoTien;
        trans.NgayGiaoDich = request.NgayGiaoDich;
        trans.NguoiGiaoDich = request.NguoiGiaoDich;
        trans.DoanVienId = request.DoanVienId;
        trans.ThangNam = request.ThangNam;
        trans.GhiChu = request.GhiChu;

        await _evidence.AttachAsync(request.FileMinhChungUrl, "Finance", trans.Id, trans.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteFinanceCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
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
