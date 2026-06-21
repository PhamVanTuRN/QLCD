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
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateEmulationCommandHandler : IRequestHandler<CreateEmulationCommand, Guid>
{
    private readonly IQLCDDbContext _context;

    public CreateEmulationCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (recordUnitId != orgId && !childOrgIds.Contains(recordUnitId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền đề cử thi đua ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (recordUnitId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền đề cử thi đua ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
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
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateEmulationCommandHandler : IRequestHandler<UpdateEmulationCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public UpdateEmulationCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    // Kiểm tra xem đơn vị gốc của bản ghi có trong quyền hạn không
                    Guid origUnitId = emulation.DonViId ?? Guid.Empty;
                    if (origUnitId == Guid.Empty && emulation.DoanVienId.HasValue)
                    {
                        var origMember = await _context.DoanViens.AsNoTracking().FirstOrDefaultAsync(d => d.Id == emulation.DoanVienId.Value, cancellationToken);
                        if (origMember != null) origUnitId = origMember.MaToCongDoan;
                    }

                    if (origUnitId != orgId && !childOrgIds.Contains(origUnitId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa bản ghi thi đua này.");
                    }

                    if (recordUnitId != orgId && !childOrgIds.Contains(recordUnitId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chuyển bản ghi thi đua ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    Guid origUnitId = emulation.DonViId ?? Guid.Empty;
                    if (origUnitId == Guid.Empty && emulation.DoanVienId.HasValue)
                    {
                        var origMember = await _context.DoanViens.AsNoTracking().FirstOrDefaultAsync(d => d.Id == emulation.DoanVienId.Value, cancellationToken);
                        if (origMember != null) origUnitId = origMember.MaToCongDoan;
                    }

                    if (origUnitId != orgId || recordUnitId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa ngoài phạm vi tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
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

    public DeleteEmulationCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteEmulationCommand request, CancellationToken cancellationToken)
    {
        var emulation = await _context.ThiDuaCongDoans
            .FirstOrDefaultAsync(e => e.Id == request.Id, cancellationToken);
        if (emulation == null)
        {
            throw new ArgumentException("Bản ghi thi đua không tồn tại.");
        }

        // Scope validation
        if (!string.IsNullOrEmpty(request.UserRole) && request.UserRole != "ADMIN" && request.UserRole != "CDCS")
        {
            if (request.ScopeOrgId.HasValue)
            {
                var orgId = request.ScopeOrgId.Value;
                
                Guid origUnitId = emulation.DonViId ?? Guid.Empty;
                if (origUnitId == Guid.Empty && emulation.DoanVienId.HasValue)
                {
                    var origMember = await _context.DoanViens.AsNoTracking().FirstOrDefaultAsync(d => d.Id == emulation.DoanVienId.Value, cancellationToken);
                    if (origMember != null) origUnitId = origMember.MaToCongDoan;
                }

                if (request.UserRole == "CDBP")
                {
                    var childOrgIds = await _context.DonViCongDoans
                        .Where(u => u.MaParent == orgId)
                        .Select(u => u.Id)
                        .ToListAsync(cancellationToken);
                    
                    if (origUnitId != orgId && !childOrgIds.Contains(origUnitId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa bản ghi thi đua này.");
                    }
                }
                else // TOCD
                {
                    if (origUnitId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền.");
            }
        }

        emulation.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
