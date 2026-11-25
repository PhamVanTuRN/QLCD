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

namespace QLCD.Application.Features.Initiatives.Commands;

// ==================== CREATE ====================
public record CreateInitiativeCommand : IRequest<Guid>
{
    public Guid DoanVienId { get; init; }
    [Required, StringLength(250)]
    public required string TenDeTai { get; init; }
    [Required, StringLength(100)]
    public required string LinhVuc { get; init; }
    [Required, StringLength(50)]
    public required string CapDeTai { get; init; }
    [StringLength(1000)]
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    [Range(1900, 2200)]
    public int NamThucHien { get; set; }
    [StringLength(100)]
    public string? KetQuaNghiemThu { get; set; }
    [Range(1, 3)]
    public int TrangThai { get; set; } = 1;
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class CreateInitiativeCommandHandler : IRequestHandler<CreateInitiativeCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public CreateInitiativeCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateInitiativeCommand request, CancellationToken cancellationToken)
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
            throw new UnauthorizedAccessException("Không có quyền đăng ký đề tài cho đoàn viên ngoài phạm vi quản lý.");
        }

        if (_currentUser.Role != SecurityRoles.Central && (request.TrangThai != 1 || !string.IsNullOrWhiteSpace(request.KetQuaNghiemThu)))
            throw new UnauthorizedAccessException("Final approval is restricted.");

        var initiative = new SangKien
        {
            DoanVienId = request.DoanVienId,
            DonViId = donViId,
            TenDeTai = request.TenDeTai,
            LinhVuc = request.LinhVuc,
            CapDeTai = request.CapDeTai,
            HieuQuaKinhTe = request.HieuQuaKinhTe,
            NgayNghiemThu = request.NgayNghiemThu,
            NamThucHien = request.NamThucHien,
            KetQuaNghiemThu = request.KetQuaNghiemThu,
            TrangThai = request.TrangThai
        };

        _context.SangKiens.Add(initiative);
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Initiatives", initiative.Id, initiative.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return initiative.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateInitiativeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DoanVienId { get; init; }
    [Required, StringLength(250)]
    public required string TenDeTai { get; init; }
    [Required, StringLength(100)]
    public required string LinhVuc { get; init; }
    [Required, StringLength(50)]
    public required string CapDeTai { get; init; }
    [StringLength(1000)]
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    [Range(1900, 2200)]
    public int NamThucHien { get; set; }
    [StringLength(100)]
    public string? KetQuaNghiemThu { get; set; }
    [Range(1, 3)]
    public int TrangThai { get; set; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
    
}

public class UpdateInitiativeCommandHandler : IRequestHandler<UpdateInitiativeCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly EvidenceLinks _evidence;
    private readonly ICurrentUserService _currentUser;

    public UpdateInitiativeCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, EvidenceLinks evidence, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _evidence = evidence;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(UpdateInitiativeCommand request, CancellationToken cancellationToken)
    {
        var initiative = await _context.SangKiens
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);
        if (initiative == null)
        {
            throw new ArgumentException("Sáng kiến/Đề tài không tồn tại.");
        }

        var member = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.DoanVienId, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        var donViId = member.MaToCongDoan;

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(initiative.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa đề tài này.");
        }

        if (!await _scopeService.IsInScopeAsync(donViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển đề tài này cho đoàn viên ngoài phạm vi quản lý.");
        }

        initiative.DoanVienId = request.DoanVienId;
        if (_currentUser.Role != SecurityRoles.Central && request.TrangThai != initiative.TrangThai)
            throw new UnauthorizedAccessException("Final approval is restricted.");

        if (_currentUser.Role != SecurityRoles.Central && (initiative.TrangThai != 1
            || (request.KetQuaNghiemThu ?? "") != (initiative.KetQuaNghiemThu ?? "")))
            throw new UnauthorizedAccessException("Acceptance results are restricted.");

        initiative.DonViId = donViId;
        initiative.TenDeTai = request.TenDeTai;
        initiative.LinhVuc = request.LinhVuc;
        initiative.CapDeTai = request.CapDeTai;
        initiative.HieuQuaKinhTe = request.HieuQuaKinhTe;
        initiative.NgayNghiemThu = request.NgayNghiemThu;
        initiative.NamThucHien = request.NamThucHien;
        initiative.KetQuaNghiemThu = request.KetQuaNghiemThu;
        initiative.TrangThai = request.TrangThai;

        await _evidence.AttachAsync(request.FileMinhChungUrl, "Initiatives", initiative.Id, initiative.DonViId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}

// ==================== DELETE ====================
public record DeleteInitiativeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
}

public class DeleteInitiativeCommandHandler : IRequestHandler<DeleteInitiativeCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUser;

    public DeleteInitiativeCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUser = currentUser;
    }

    public async Task<bool> Handle(DeleteInitiativeCommand request, CancellationToken cancellationToken)
    {
        var initiative = await _context.SangKiens
            .FirstOrDefaultAsync(i => i.Id == request.Id, cancellationToken);
        if (initiative == null)
        {
            throw new ArgumentException("Sáng kiến/Đề tài không tồn tại.");
        }

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(initiative.DonViId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa đề tài này.");
        }

        if (_currentUser.Role != SecurityRoles.Central && initiative.TrangThai != 1)
            throw new UnauthorizedAccessException("Deletion of a decided record is restricted.");

        initiative.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
