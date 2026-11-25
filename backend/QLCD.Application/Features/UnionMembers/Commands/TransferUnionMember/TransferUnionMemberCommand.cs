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
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;

public record TransferUnionMemberCommand : IRequest<bool>
{
    public Guid DoanVienId { get; init; }
    public Guid DenToCongDoanId { get; init; }
    [Required, StringLength(500)]
    public required string LyDo { get; init; }
    public DateTime NgayHieuLuc { get; init; }
    [StringLength(500)]
    public string? FileMinhChungUrl { get; init; }
}

public class TransferUnionMemberCommandHandler : IRequestHandler<TransferUnionMemberCommand, bool>
{
    // EF InMemory cannot roll back an earlier insert if a later write fails its concurrency check.
    private static readonly SemaphoreSlim InMemoryTransfers = new(1, 1);
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICurrentUserService _currentUserService;
    private readonly EvidenceLinks _evidence;

    public TransferUnionMemberCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICurrentUserService currentUserService, EvidenceLinks evidence)
    {
        _context = context;
        _scopeService = scopeService;
        _currentUserService = currentUserService;
        _evidence = evidence;
    }

    public async Task<bool> Handle(TransferUnionMemberCommand request, CancellationToken cancellationToken)
    {
        if (_currentUserService.Role is not (SecurityRoles.Admin or SecurityRoles.Central or SecurityRoles.Department))
            throw new UnauthorizedAccessException("Transfer operation not permitted.");

        if (_context.Database.IsRelational())
            return await TransferAsync(request, cancellationToken);

        await InMemoryTransfers.WaitAsync(cancellationToken);
        try
        {
            return await TransferAsync(request, cancellationToken);
        }
        finally
        {
            InMemoryTransfers.Release();
        }
    }

    private async Task<bool> TransferAsync(TransferUnionMemberCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra đoàn viên tồn tại
        var doanVien = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.DoanVienId, cancellationToken);
        if (doanVien == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        // Lưu lại đơn vị cũ để ghi lịch sử
        var tuToId = doanVien.MaToCongDoan;

        // Chặn chuyển nếu đơn vị mới giống đơn vị cũ
        if (tuToId == request.DenToCongDoanId)
        {
            throw new ArgumentException("Tổ công đoàn đích trùng với tổ công đoàn hiện tại.");
        }

        // Scope validation - check source org
        if (!await _scopeService.IsInScopeAsync(tuToId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển đi đoàn viên ngoài phạm vi quản lý.");
        }

        // Scope validation - check target org
        if (!await _scopeService.IsInScopeAsync(request.DenToCongDoanId, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chuyển đoàn viên tới đơn vị ngoài phạm vi quản lý.");
        }

        var validTarget = await _context.DonViCongDoans.AnyAsync(unit => unit.Id == request.DenToCongDoanId
            && unit.TrangThai == 1 && (unit.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP
                || unit.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS), cancellationToken);
        if (!validTarget)
            throw new ArgumentException("The destination must be an active union team.");

        doanVien.MaToCongDoan = request.DenToCongDoanId;
        var history = new LichSuBienDong
        {
            DoanVienId = request.DoanVienId,
            LoaiBienDong = LoaiBienDong.ChuyenSinhHoat,
            TuToCongDoanId = tuToId,
            DenToCongDoanId = request.DenToCongDoanId,
            LyDo = request.LyDo,
            NgayHieuLuc = request.NgayHieuLuc,
            NguoiThucHienId = _currentUserService.UserId ?? Guid.Empty,
            FileMinhChungUrl = request.FileMinhChungUrl
        };

        _context.LichSuBienDongs.Add(history);
        await _evidence.AttachAsync(request.FileMinhChungUrl, "Members", history.Id, tuToId, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
