using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Events.Commands;

public class DeleteEventCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteEventCommandHandler : IRequestHandler<DeleteEventCommand>
{
    private readonly IAttendanceDbContext _context;

    public DeleteEventCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteEventCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Events
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("Event", request.Id);
        }

        // Soft delete
        entity.IsDeleted = true;
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
