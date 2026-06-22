using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.UnionMembers.Commands.DeleteUnionMember;

public record DeleteUnionMemberCommand(Guid Id) : IRequest<bool>;

public class DeleteUnionMemberCommandHandler : IRequestHandler<DeleteUnionMemberCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public DeleteUnionMemberCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<bool> Handle(DeleteUnionMemberCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(member.MaToCongDoan, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xóa đoàn viên ngoài phạm vi quản lý.");
        }

        // Soft delete
        member.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
