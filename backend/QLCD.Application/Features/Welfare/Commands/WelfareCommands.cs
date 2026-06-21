using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Welfare.Commands;

// ==================== CREATE ====================
public record CreateWelfareCommand : IRequest<Guid>
{
    public Guid DoanVienId { get; init; }
    public required string LoaiPhucLoi { get; init; }
    public decimal KinhPhiHoTro { get; init; }
    public DateTime NgayHoTro { get; init; }
    public required string LyDo { get; init; }
    public int TrangThai { get; init; } = 1;          // 1: Pending, 2: Approved, 3: Rejected
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class CreateWelfareCommandHandler : IRequestHandler<CreateWelfareCommand, Guid>
{
    private readonly IQLCDDbContext _context;

    public CreateWelfareCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                        throw new UnauthorizedAccessException("Không có quyền đề xuất phúc lợi cho đoàn viên ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (donViId != orgId)
                    {
                        throw new UnauthorizedAccessException("Không có quyền đề xuất phúc lợi cho đoàn viên ngoài tổ công đoàn.");
                    }
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Không có quyền truy cập.");
            }
        }

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
        await _context.SaveChangesAsync(cancellationToken);
        return record.Id;
    }
}

// ==================== UPDATE ====================
public record UpdateWelfareCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public Guid DoanVienId { get; init; }
    public required string LoaiPhucLoi { get; init; }
    public decimal KinhPhiHoTro { get; init; }
    public DateTime NgayHoTro { get; init; }
    public required string LyDo { get; init; }
    public int TrangThai { get; init; }
    public string? FileMinhChungUrl { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class UpdateWelfareCommandHandler : IRequestHandler<UpdateWelfareCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public UpdateWelfareCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (record.DonViId != orgId && !childOrgIds.Contains(record.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chỉnh sửa bản ghi phúc lợi này.");
                    }
                    if (donViId != orgId && !childOrgIds.Contains(donViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền chuyển bản ghi phúc lợi sang đoàn viên ngoài phạm vi quản lý.");
                    }
                }
                else // TOCD
                {
                    if (record.DonViId != orgId || donViId != orgId)
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

        record.DoanVienId = request.DoanVienId;
        record.DonViId = donViId;
        record.LoaiPhucLoi = request.LoaiPhucLoi;
        record.KinhPhiHoTro = request.KinhPhiHoTro;
        record.NgayHoTro = request.NgayHoTro;
        record.LyDo = request.LyDo;
        record.TrangThai = request.TrangThai;
        record.FileMinhChungUrl = request.FileMinhChungUrl;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}

// ==================== DELETE ====================
public record DeleteWelfareCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    
    // Auth context
    public Guid? ScopeOrgId { get; init; }
    public string? UserRole { get; init; }
}

public class DeleteWelfareCommandHandler : IRequestHandler<DeleteWelfareCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public DeleteWelfareCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
                    
                    if (record.DonViId != orgId && !childOrgIds.Contains(record.DonViId))
                    {
                        throw new UnauthorizedAccessException("Không có quyền xóa bản ghi phúc lợi này.");
                    }
                }
                else // TOCD
                {
                    if (record.DonViId != orgId)
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

        record.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
