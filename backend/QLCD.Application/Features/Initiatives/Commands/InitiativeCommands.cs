using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Initiatives.Commands;

// ==================== CREATE ====================
public record CreateInitiativeCommand : IRequest<Guid>
{
    public Guid DoanVienId { get; init; }
    public required string TenDeTai { get; init; }
    public required string LinhVuc { get; init; }
    public required string CapDeTai { get; init; }
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    public int NamThucHien { get; set; }
    public string? KetQuaNghiemThu { get; set; }
    public int TrangThai { get; set; } = 1;
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateInitiativeCommandHandler : IRequestHandler<CreateInitiativeCommand, Guid>
{
    private readonly IQLCDDbContext _context;

    public CreateInitiativeCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (donViId != orgId && !childOrgIds.Contains(donViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền đăng ký đề tài cho đoàn viên ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (donViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền đăng ký đề tài ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
        }

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
        await _context.SaveChangesAsync(cancellationToken);
        return initiative.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateInitiativeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DoanVienId { get; init; }
    public required string TenDeTai { get; init; }
    public required string LinhVuc { get; init; }
    public required string CapDeTai { get; init; }
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    public int NamThucHien { get; set; }
    public string? KetQuaNghiemThu { get; set; }
    public int TrangThai { get; set; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateInitiativeCommandHandler : IRequestHandler<UpdateInitiativeCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public UpdateInitiativeCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (initiative.DonViId != orgId && !childOrgIds.Contains(initiative.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa đề tài này.");
                    }
                    if (donViId != orgId && !childOrgIds.Contains(donViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chuyển đề tài này cho đoàn viên ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (initiative.DonViId != orgId || donViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa đề tài ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
        }

        initiative.DoanVienId = request.DoanVienId;
        initiative.DonViId = donViId;
        initiative.TenDeTai = request.TenDeTai;
        initiative.LinhVuc = request.LinhVuc;
        initiative.CapDeTai = request.CapDeTai;
        initiative.HieuQuaKinhTe = request.HieuQuaKinhTe;
        initiative.NgayNghiemThu = request.NgayNghiemThu;
        initiative.NamThucHien = request.NamThucHien;
        initiative.KetQuaNghiemThu = request.KetQuaNghiemThu;
        initiative.TrangThai = request.TrangThai;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// ==================== DELETE ====================
public record DeleteInitiativeCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class DeleteInitiativeCommandHandler : IRequestHandler<DeleteInitiativeCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public DeleteInitiativeCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (initiative.DonViId != orgId && !childOrgIds.Contains(initiative.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa đề tài này.");
                    }
                }
                else // TOCD
                {
                    if (initiative.DonViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa đề tài ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
        }

        initiative.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
