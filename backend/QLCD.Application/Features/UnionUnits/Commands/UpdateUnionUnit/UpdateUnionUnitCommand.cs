using QLCD.Application.Common;
using QLCD.Application.Features.ManagementBlocks;
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
    private readonly ICurrentUserService _user;

    public UpdateUnionUnitCommandHandler(IQLCDDbContext context, ICurrentUserService user)
    {
        _context = context;
        _user = user;
    }

    public async Task<bool> Handle(UpdateUnionUnitCommand request, CancellationToken cancellationToken)
    {
        OrganizationLifecycle.RequireManager(_user);
        await using var transaction = _context.Database.IsRelational()
            ? await _context.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken) : null;
        var unit = await _context.DonViCongDoans
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);

        if (unit == null)
        {
            throw new ArgumentException("Đơn vị công đoàn không tồn tại.");
        }

        if (request.TrangThai != unit.TrangThai)
            throw new OrganizationStateException("Dùng thao tác Ngừng hoạt động hoặc Khôi phục đơn vị riêng; sửa thông tin không đổi trạng thái.");
        await ManagementBlockAssignment.ValidateAsync(_context, request.MaKhoi, unit.MaKhoi, false, cancellationToken);
        unit.TenDonVi = request.TenDonVi;
        unit.MaKhoi = request.MaKhoi;

        await _context.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return true;
    }
}
