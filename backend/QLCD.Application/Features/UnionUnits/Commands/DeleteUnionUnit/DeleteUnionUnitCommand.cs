using MediatR;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;

// Retain DELETE v1 for existing clients: it now deactivates, never deletes records.
public record DeleteUnionUnitCommand(Guid Id) : IRequest<bool>;
public class DeleteUnionUnitCommandHandler(IQLCDDbContext db, ICurrentUserService user) : IRequestHandler<DeleteUnionUnitCommand, bool>
{
    public Task<bool> Handle(DeleteUnionUnitCommand request, CancellationToken ct) =>
        OrganizationLifecycle.ChangeAsync(db, user, request.Id, false, ct);
}
