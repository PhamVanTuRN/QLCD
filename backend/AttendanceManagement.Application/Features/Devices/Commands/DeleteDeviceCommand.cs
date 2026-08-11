using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Devices.Commands;

public class DeleteDeviceCommand : IRequest
{
    public Guid Id { get; set; }
}

public class DeleteDeviceCommandHandler : IRequestHandler<DeleteDeviceCommand>
{
    private readonly IAttendanceDbContext _context;

    public DeleteDeviceCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeleteDeviceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.AttendanceDevices
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("Device", request.Id);
        }

        // Soft delete
        entity.IsDeleted = true;
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
