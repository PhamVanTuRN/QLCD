using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Emulations.Commands;

// ==================== CREATE ====================
public record CreateEmulationCommand : IRequest<Guid>
{
    public required string TenPhongTrao { get; init; }
    public Guid? DoanVienId { get; init; }
    public Guid? DonViId { get; init; }
    public int Nam { get; init; }
    public decimal DiemTuDanhGia { get; init; }
    public decimal DiemBchDuyet { get; init; }
    public required string XepLoai { get; init; }
    public string? KhenThuong { get; init; }
    public int TrangThai { get; init; } = 1;          // 1: Registered, 2: Evaluated, 3: Awarded
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateEmulationCommandHandler : IRequestHandler<CreateEmulationCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public CreateEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
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

        var emulation = new ThiDuaCongDoan
        {
            TenPhongTrao = request.TenPhongTrao,
            DoanVienId = request.DoanVienId,
            DonViId = request.DonViId,
            Nam = request.Nam,
            DiemTuDanhGia = request.DiemTuDanhGia,
            DiemBchDuyet = request.DiemBchDuyet,
            XepLoai = request.XepLoai,
            KhenThuong = request.KhenThuong,
            TrangThai = request.TrangThai
        };

        _context.ThiDuaCongDoans.Add(emulation);
        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = emulation.Id;
                file.OrganizationId = recordUnitId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return emulation.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateEmulationCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public required string TenPhongTrao { get; init; }
    public Guid? DoanVienId { get; init; }
    public Guid? DonViId { get; init; }
    public int Nam { get; init; }
    public decimal DiemTuDanhGia { get; init; }
    public decimal DiemBchDuyet { get; init; }
    public required string XepLoai { get; init; }
    public string? KhenThuong { get; init; }
    public int TrangThai { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateEmulationCommandHandler : IRequestHandler<UpdateEmulationCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public UpdateEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
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

        if (origUnitId != Guid.Empty && !await _scopeService.IsInScopeAsync(origUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa bản ghi thi đua này.");
        }

        emulation.TenPhongTrao = request.TenPhongTrao;
        emulation.DoanVienId = request.DoanVienId;
        emulation.DonViId = request.DonViId;
        emulation.Nam = request.Nam;
        emulation.DiemTuDanhGia = request.DiemTuDanhGia;
        emulation.DiemBchDuyet = request.DiemBchDuyet;
        emulation.XepLoai = request.XepLoai;
        emulation.KhenThuong = request.KhenThuong;
        emulation.TrangThai = request.TrangThai;

        await _context.SaveChangesAsync(cancellationToken);

        // Link uploaded file
        if (Guid.TryParse(request.FileMinhChungUrl, out Guid fileId))
        {
            var file = await _context.EvidenceFiles.FirstOrDefaultAsync(f => f.Id == fileId && !f.IsDeleted, cancellationToken);
            if (file != null)
            {
                file.RelatedEntityId = emulation.Id;
                file.OrganizationId = recordUnitId;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteEmulationCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class DeleteEmulationCommandHandler : IRequestHandler<DeleteEmulationCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public DeleteEmulationCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
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
        if (origUnitId != Guid.Empty && !await _scopeService.IsInScopeAsync(origUnitId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa bản ghi thi đua này.");
        }

        emulation.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
