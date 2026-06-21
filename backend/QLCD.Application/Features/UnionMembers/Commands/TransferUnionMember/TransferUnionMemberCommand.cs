using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;

public record TransferUnionMemberCommand : IRequest<bool>
{
    public Guid DoanVienId { get; init; }
    public Guid DenToCongDoanId { get; init; }
    public required string LyDo { get; init; }
    public DateTime NgayHieuLuc { get; init; }
    public string? FileMinhChungUrl { get; init; }
}

public class TransferUnionMemberCommandHandler : IRequestHandler<TransferUnionMemberCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public TransferUnionMemberCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(TransferUnionMemberCommand request, CancellationToken cancellationToken)
    {
        // Sử dụng Database Transaction để đảm bảo tính toàn vẹn số liệu thống kê và lịch sử biến động (chỉ chạy nếu không phải In-Memory)
        var useTransaction = _context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
        var transaction = useTransaction ? await _context.Database.BeginTransactionAsync(cancellationToken) : null;

        try
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

            // 2. Kiểm tra tổ công đoàn đích hợp lệ
            var toCongDoanDich = await _context.DonViCongDoans
                .FirstOrDefaultAsync(u => u.Id == request.DenToCongDoanId, cancellationToken);
            if (toCongDoanDich == null)
            {
                throw new ArgumentException("Tổ công đoàn đích không tồn tại.");
            }

            // 3. Cập nhật Tổ công đoàn của đoàn viên
            doanVien.MaToCongDoan = request.DenToCongDoanId;

            // 4. Tạo bản ghi lịch sử biến động
            var history = new LichSuBienDong
            {
                DoanVienId = request.DoanVienId,
                LoaiBienDong = LoaiBienDong.ChuyenSinhHoat,
                TuToCongDoanId = tuToId,
                DenToCongDoanId = request.DenToCongDoanId,
                LyDo = request.LyDo,
                NgayHieuLuc = request.NgayHieuLuc,
                NguoiThucHienId = Guid.Empty, // Hệ thống tự động/hoặc người quản trị
                FileMinhChungUrl = request.FileMinhChungUrl
            };

            _context.LichSuBienDongs.Add(history);
            await _context.SaveChangesAsync(cancellationToken);

            // Commit Transaction
            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
                transaction.Dispose();
            }
            return true;
        }
        catch (Exception)
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
                transaction.Dispose();
            }
            throw;
        }
    }
}
