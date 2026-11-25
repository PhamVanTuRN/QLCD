using System.ComponentModel.DataAnnotations;
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
    [Required, StringLength(150)]
    public required string TenDonVi { get; init; }
    public Guid? MaKhoi { get; init; }
    [Range(0, 1)]
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

        var accounts = await _context.TaiKhoans.Where(account => account.OrganizationId == request.Id)
            .ToListAsync(cancellationToken);
        foreach (var account in accounts)
        {
            account.HoTen = $"Quản lý {request.TenDonVi}";
            if (request.TrangThai != 1)
                account.SecurityVersion = Guid.NewGuid();
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
