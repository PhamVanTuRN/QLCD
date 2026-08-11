using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Locations.Commands;

public class DeleteLocationCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteLocationCommandHandler : IRequestHandler<DeleteLocationCommand>
{
    private readonly IAttendanceDbContext _context;

    public DeleteLocationCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteLocationCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Locations
            .Include(x => x.AttendanceDevices)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("Location", request.Id);
        }

        if (entity.AttendanceDevices.Count > 0)
        {
            throw new BadRequestException("Cannot delete location with registered devices.");
        }

        // Soft delete
        entity.IsDeleted = true;
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
