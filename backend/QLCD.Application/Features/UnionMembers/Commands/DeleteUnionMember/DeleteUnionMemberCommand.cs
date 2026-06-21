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

    public DeleteUnionMemberCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteUnionMemberCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.DoanViens
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        // Soft delete
        member.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
