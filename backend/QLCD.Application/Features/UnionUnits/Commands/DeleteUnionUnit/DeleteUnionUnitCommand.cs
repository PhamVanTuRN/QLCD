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
