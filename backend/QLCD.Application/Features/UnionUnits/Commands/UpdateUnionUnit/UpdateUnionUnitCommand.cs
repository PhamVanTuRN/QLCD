using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

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
