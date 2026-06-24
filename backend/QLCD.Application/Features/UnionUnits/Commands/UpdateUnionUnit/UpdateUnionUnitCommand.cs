using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;

public record UpdateUnionUnitCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public required string TenDonVi { get; init; }
    public Guid? MaKhoi { get; init; }
    public int TrangThai { get; init; }
}

public class UpdateUnionUnitCommandHandler : IRequestHandler<UpdateUnionUnitCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public UpdateUnionUnitCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateUnionUnitCommand request, CancellationToken cancellationToken)
    {
        var unit = await _context.DonViCongDoans
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (unit == null)
        {
            throw new ArgumentException("Đơn vị công đoàn không tồn tại.");
        }

        if (request.TrangThai == 0 && unit.TrangThai == 1)
        {
            // Kiểm tra xem đơn vị này có đơn vị con nào đang hoạt động không
            var hasActiveChildren = await _context.DonViCongDoans
                .AnyAsync(u => u.MaParent == request.Id && u.TrangThai == 1, cancellationToken);
            if (hasActiveChildren)
            {
                throw new ArgumentException("Không thể ngừng hoạt động đơn vị này vì vẫn còn các đơn vị con đang hoạt động. Vui lòng giải thể hoặc chuyển cấp các đơn vị con trước.");
            }

            // Kiểm tra xem đơn vị này có đoàn viên nào đang sinh hoạt trực thuộc không
            var hasActiveMembers = await _context.DoanViens
                .AnyAsync(d => d.MaToCongDoan == request.Id && d.TrangThai == TrangThaiDoanVien.DangSinhHoat, cancellationToken);
            if (hasActiveMembers)
            {
                throw new ArgumentException("Không thể ngừng hoạt động đơn vị này vì vẫn còn đoàn viên đang sinh hoạt. Vui lòng điều chuyển tất cả đoàn viên sang đơn vị khác trước.");
            }
        }

        unit.TenDonVi = request.TenDonVi;
        unit.MaKhoi = request.MaKhoi;
        unit.TrangThai = request.TrangThai;

        // Cập nhật tên của tài khoản tương ứng nếu có
        var account = await _context.TaiKhoans
            .FirstOrDefaultAsync(a => a.OrganizationId == request.Id, cancellationToken);
        if (account != null)
        {
            account.HoTen = $"Quản lý {request.TenDonVi}";
            account.TrangThai = request.TrangThai == 1;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
