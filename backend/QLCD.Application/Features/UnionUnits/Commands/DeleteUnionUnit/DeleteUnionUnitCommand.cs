using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;

public record DeleteUnionUnitCommand(Guid Id) : IRequest<bool>;

public class DeleteUnionUnitCommandHandler : IRequestHandler<DeleteUnionUnitCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public DeleteUnionUnitCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteUnionUnitCommand request, CancellationToken cancellationToken)
    {
        var unit = await _context.DonViCongDoans
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (unit == null)
        {
            throw new ArgumentException("Đơn vị công đoàn không tồn tại.");
        }

        // Kiểm tra xem đơn vị này có đơn vị con đang hoạt động không
        var hasChildren = await _context.DonViCongDoans
            .AnyAsync(u => u.MaParent == request.Id, cancellationToken);
        if (hasChildren)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì vẫn còn các đơn vị con đang trực thuộc.");
        }

        // Kiểm tra xem đơn vị này có đoàn viên nào đang sinh hoạt trực thuộc không
        var hasMembers = await _context.DoanViens
            .AnyAsync(d => d.MaToCongDoan == request.Id, cancellationToken);
        if (hasMembers)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì vẫn còn đoàn viên đang sinh hoạt trực thuộc.");
        }

        // Kiểm tra dữ liệu hoạt động phong trào phát sinh
        var hasActivities = await _context.HoatDongCongDoans
            .AnyAsync(h => h.DonViId == request.Id, cancellationToken);
        if (hasActivities)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Hoạt động Công đoàn. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu tài chính phát sinh
        var hasFinances = await _context.TaiChinhCongDoans
            .AnyAsync(t => t.DonViId == request.Id, cancellationToken);
        if (hasFinances)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Tài chính Công đoàn. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu phúc lợi phát sinh
        var hasWelfares = await _context.PhucLoiDoanViens
            .AnyAsync(p => p.DonViId == request.Id, cancellationToken);
        if (hasWelfares)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Phúc lợi Đoàn viên. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu sáng kiến phát sinh
        var hasInitiatives = await _context.SangKiens
            .AnyAsync(s => s.DonViId == request.Id, cancellationToken);
        if (hasInitiatives)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Sáng kiến & Đề tài. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu thi đua phát sinh
        var hasEmulations = await _context.ThiDuaCongDoans
            .AnyAsync(t => t.DonViId == request.Id, cancellationToken);
        if (hasEmulations)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Thi đua Công đoàn. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu đánh giá chất lượng phát sinh
        var hasEvaluations = await _context.QualityEvaluations
            .AnyAsync(q => q.DonViCongDoanId == request.Id, cancellationToken);
        if (hasEvaluations)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Đánh giá Chất lượng. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Kiểm tra dữ liệu chỉ số chất lượng thủ công phát sinh
        var hasManualInputs = await _context.QualityManualInputs
            .AnyAsync(q => q.DonViCongDoanId == request.Id, cancellationToken);
        if (hasManualInputs)
        {
            throw new ArgumentException("Không thể xóa đơn vị này vì đã phát sinh dữ liệu Chỉ số chất lượng. Vui lòng chuyển đơn vị sang trạng thái Ngừng hoạt động.");
        }

        // Thực hiện soft-delete đơn vị
        unit.IsDeleted = true;
        unit.TrangThai = 0;

        // Soft-delete tài khoản quản lý tương ứng
        var account = await _context.TaiKhoans
            .FirstOrDefaultAsync(a => a.OrganizationId == request.Id, cancellationToken);
        if (account != null)
        {
            account.IsDeleted = true;
            account.TrangThai = false;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
