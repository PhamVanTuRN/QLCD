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

namespace QLCD.Application.Features.Welfare.Commands;

// ==================== CREATE ====================
public record CreateWelfareCommand : IRequest<Guid>
{
    public Guid DoanVienId { get; init; }
    [Required, StringLength(50)]
    public required string LoaiPhucLoi { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal KinhPhiHoTro { get; init; }
    public DateTime NgayHoTro { get; init; }
    [Required, StringLength(500)]
    public required string LyDo { get; init; }
    [Range(1, 3)]
    public int TrangThai { get; init; } = 1;          // 1: Pending, 2: Approved, 3: Rejected
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class CreateWelfareCommandHandler : IRequestHandler<CreateWelfareCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public CreateWelfareCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateWelfareCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.DoanVienId, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        var donViId = member.MaToCongDoan;

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(donViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền đề xuất phúc lợi cho đoàn viên ngoài phạm vi quản lý.");
        }

        if (_currentUser.Role != SecurityRoles.Central && request.TrangThai != 1)
            throw new UnauthorizedAccessException("Final approval is restricted.");

        var record = new PhucLoiDoanVien
        {
            DoanVienId = request.DoanVienId,
            DonViId = donViId,
            LoaiPhucLoi = request.LoaiPhucLoi,
            KinhPhiHoTro = request.KinhPhiHoTro,
            NgayHoTro = request.NgayHoTro,
            LyDo = request.LyDo,
            TrangThai = request.TrangThai,
            FileMinhChungUrl = request.FileMinhChungUrl
        };

        _context.PhucLoiDoanViens.Add(record);
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Welfare", record.Id, record.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return record.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateWelfareCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DoanVienId { get; init; }
    [Required, StringLength(50)]
    public required string LoaiPhucLoi { get; init; }
    [Range(typeof(decimal), "0", "9999999999999999.99")]
    public decimal KinhPhiHoTro { get; init; }
    public DateTime NgayHoTro { get; init; }
    [Required, StringLength(500)]
    public required string LyDo { get; init; }
    [Range(1, 3)]
    public int TrangThai { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class UpdateWelfareCommandHandler : IRequestHandler<UpdateWelfareCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public UpdateWelfareCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(UpdateWelfareCommand request, CancellationToken cancellationToken)
    {
        var record = await _context.PhucLoiDoanViens
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (record == null)
        {
            throw new ArgumentException("Bản ghi phúc lợi không tồn tại.");
        }

        var member = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.DoanVienId, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        var donViId = member.MaToCongDoan;

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(record.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa bản ghi phúc lợi này.");
        }

        if (!await _scopeService.IsInScopeAsync(donViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển bản ghi phúc lợi sang đoàn viên ngoài phạm vi quản lý.");
        }

        record.DoanVienId = request.DoanVienId;
        if (_currentUser.Role != SecurityRoles.Central && request.TrangThai != record.TrangThai)
            throw new UnauthorizedAccessException("Final approval is restricted.");

        if (_currentUser.Role != SecurityRoles.Central && record.TrangThai != 1)
            throw new UnauthorizedAccessException("An approved welfare record may not be edited by a proposer.");

        record.DonViId = donViId;
        record.LoaiPhucLoi = request.LoaiPhucLoi;
        record.KinhPhiHoTro = request.KinhPhiHoTro;
        record.NgayHoTro = request.NgayHoTro;
        record.LyDo = request.LyDo;
        record.TrangThai = request.TrangThai;
        record.FileMinhChungUrl = request.FileMinhChungUrl;

        await _evidence.AttachAsync(request.FileMinhChungUrl, "Welfare", record.Id, record.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteWelfareCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
}

public class DeleteWelfareCommandHandler : IRequestHandler<DeleteWelfareCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUser;

    public DeleteWelfareCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(DeleteWelfareCommand request, CancellationToken cancellationToken)
    {
        var record = await _context.PhucLoiDoanViens
            .FirstOrDefaultAsync(w => w.Id == request.Id, cancellationToken);
        if (record == null)
        {
            throw new ArgumentException("Bản ghi phúc lợi không tồn tại.");
        }

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(record.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa bản ghi phúc lợi này.");
        }

        if (_currentUser.Role != SecurityRoles.Central && record.TrangThai != 1)
            throw new UnauthorizedAccessException("Deletion of a decided record is restricted.");

        record.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
