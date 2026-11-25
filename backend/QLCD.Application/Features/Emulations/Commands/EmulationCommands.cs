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

namespace QLCD.Application.Features.Emulations.Commands;

// ==================== CREATE ====================
public record CreateEmulationCommand : IRequest<Guid>
{
    [Required, StringLength(250)]
    public required string TenPhongTrao { get; init; }
    public Guid? DoanVienId { get; init; }
    public Guid? DonViId { get; init; }
    [Range(1900, 2200)]
    public int Nam { get; init; }
    [Range(0, 100)]
    public decimal DiemTuDanhGia { get; init; }
    [Range(0, 100)]
    public decimal DiemBchDuyet { get; init; }
    [Required, StringLength(50)]
    public required string XepLoai { get; init; }
    [StringLength(250)]
    public string? KhenThuong { get; init; }
    [Range(1, 3)]
    public int TrangThai { get; init; } = 1;          // 1: Registered, 2: Evaluated, 3: Awarded
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class CreateEmulationCommandHandler : IRequestHandler<CreateEmulationCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public CreateEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateEmulationCommand request, CancellationToken cancellationToken)
    {
        Guid recordUnitId = Guid.Empty;
        if (request.DoanVienId.HasValue)
        {
            var member = await _context.DoanViens
                .FirstOrDefaultAsync(d => d.Id == request.DoanVienId.Value, cancellationToken);
            if (member == null)
            {
                throw new ArgumentException("Đoàn viên không tồn tại.");
            }
            recordUnitId = member.MaToCongDoan;
            if (request.DonViId.HasValue && request.DonViId != recordUnitId)
                throw new ArgumentException("The member and emulation must belong to the same unit.");
        }
        else if (request.DonViId.HasValue)
        {
            recordUnitId = request.DonViId.Value;
        }
        else
        {
            throw new ArgumentException("Phong trào thi đua phải được gán cho một cá nhân hoặc tập thể cụ thể.");
        }

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(recordUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền đề cử thi đua ngoài phạm vi quản lý.");
        }

        if (_currentUser.Role != SecurityRoles.Central && (request.TrangThai != 1
            || request.DiemBchDuyet != 0 || !string.IsNullOrWhiteSpace(request.KhenThuong)))
            throw new UnauthorizedAccessException("Final emulation approval is restricted.");

        var emulation = new ThiDuaCongDoan
        {
            TenPhongTrao = request.TenPhongTrao,
            DoanVienId = request.DoanVienId,
            DonViId = recordUnitId,
            Nam = request.Nam,
            DiemTuDanhGia = request.DiemTuDanhGia,
            DiemBchDuyet = request.DiemBchDuyet,
            XepLoai = request.XepLoai,
            KhenThuong = request.KhenThuong,
            TrangThai = request.TrangThai
        };

        _context.ThiDuaCongDoans.Add(emulation);
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Emulations", emulation.Id, recordUnitId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return emulation.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateEmulationCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    [Required, StringLength(250)]
    public required string TenPhongTrao { get; init; }
    public Guid? DoanVienId { get; init; }
    public Guid? DonViId { get; init; }
    [Range(1900, 2200)]
    public int Nam { get; init; }
    [Range(0, 100)]
    public decimal DiemTuDanhGia { get; init; }
    [Range(0, 100)]
    public decimal DiemBchDuyet { get; init; }
    [Required, StringLength(50)]
    public required string XepLoai { get; init; }
    [StringLength(250)]
    public string? KhenThuong { get; init; }
    [Range(1, 3)]
    public int TrangThai { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class UpdateEmulationCommandHandler : IRequestHandler<UpdateEmulationCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public UpdateEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(UpdateEmulationCommand request, CancellationToken cancellationToken)
    {
        var emulation = await _context.ThiDuaCongDoans
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);
        if (emulation == null)
        {
            throw new ArgumentException("Bản ghi thi đua không tồn tại.");
        }

        Guid recordUnitId = Guid.Empty;
        if (request.DoanVienId.HasValue)
        {
            var member = await _context.DoanViens
                .FirstOrDefaultAsync(d => d.Id == request.DoanVienId.Value, cancellationToken);
            if (member == null)
            {
                throw new ArgumentException("Đoàn viên không tồn tại.");
            }
            recordUnitId = member.MaToCongDoan;
            if (request.DonViId.HasValue && request.DonViId != recordUnitId)
                throw new ArgumentException("The member and emulation must belong to the same unit.");
        }
        else if (request.DonViId.HasValue)
        {
            recordUnitId = request.DonViId.Value;
        }
        else
        {
            throw new ArgumentException("Thi đua phải được gán cho một cá nhân hoặc tập thể.");
        }

        // Scope validation - check target org
        if (!await _scopeService.IsInScopeAsync(recordUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển bản ghi thi đua ngoài phạm vi quản lý.");
        }

        // Scope validation - check source org
        Guid origUnitId = emulation.DonViId ?? Guid.Empty;
        if (origUnitId == Guid.Empty && emulation.DoanVienId.HasValue)
        {
            var origMember = await _context.DoanViens.AsNoTracking().FirstOrDefaultAsync(d => d.Id == emulation.DoanVienId.Value, cancellationToken);
            if (origMember != null) origUnitId = origMember.MaToCongDoan;
        }

        if (origUnitId == Guid.Empty || !await _scopeService.IsInScopeAsync(origUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa bản ghi thi đua này.");
        }

        if (emulation.DoanVienId.HasValue && (emulation.DonViId.HasValue
            && !await _context.DoanViens.AnyAsync(member => member.Id == emulation.DoanVienId
                && member.MaToCongDoan == origUnitId, cancellationToken)))
            throw new UnauthorizedAccessException("The historical record has inconsistent ownership.");
        if (_currentUser.Role != SecurityRoles.Central && (emulation.TrangThai != 1 || request.TrangThai != emulation.TrangThai
            || request.DiemBchDuyet != emulation.DiemBchDuyet || (request.KhenThuong ?? "") != (emulation.KhenThuong ?? "")
            || request.XepLoai != emulation.XepLoai))
            throw new UnauthorizedAccessException("Final emulation approval is restricted.");

        emulation.TenPhongTrao = request.TenPhongTrao;
        emulation.DoanVienId = request.DoanVienId;
        emulation.DonViId = recordUnitId;
        emulation.Nam = request.Nam;
        emulation.DiemTuDanhGia = request.DiemTuDanhGia;
        emulation.DiemBchDuyet = request.DiemBchDuyet;
        emulation.XepLoai = request.XepLoai;
        emulation.KhenThuong = request.KhenThuong;
        emulation.TrangThai = request.TrangThai;

        await _evidence.AttachAsync(request.FileMinhChungUrl, "Emulations", emulation.Id, recordUnitId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteEmulationCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
}

public class DeleteEmulationCommandHandler : IRequestHandler<DeleteEmulationCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUser;

    public DeleteEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(DeleteEmulationCommand request, CancellationToken cancellationToken)
    {
        var emulation = await _context.ThiDuaCongDoans
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);
        if (emulation == null)
        {
            throw new ArgumentException("Bản ghi thi đua không tồn tại.");
        }

        Guid origUnitId = emulation.DonViId ?? Guid.Empty;
        if (origUnitId == Guid.Empty && emulation.DoanVienId.HasValue)
        {
            var origMember = await _context.DoanViens.AsNoTracking().FirstOrDefaultAsync(d => d.Id == emulation.DoanVienId.Value, cancellationToken);
            if (origMember != null) origUnitId = origMember.MaToCongDoan;
        }

        // Scope validation
        if (origUnitId == Guid.Empty || !await _scopeService.IsInScopeAsync(origUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa bản ghi thi đua này.");
        }

        if (_currentUser.Role != SecurityRoles.Central && emulation.TrangThai != 1)
            throw new UnauthorizedAccessException("Deletion of a decided record is restricted.");

        emulation.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
