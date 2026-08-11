using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Events.Commands;

public class PublishEventCommand : IRequest
{
    public Guid Id { get; set; }
}

public class PublishEventCommandHandler : IRequestHandler<PublishEventCommand>
{
    private readonly IAttendanceDbContext _context;

    public PublishEventCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(PublishEventCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Events
            .Include(e => e.Sessions).ThenInclude(s => s.AttendanceRules)
            .Include(e => e.EventLocations)
            .Include(e => e.EventDevices)
            .Include(e => e.Participants)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            throw new NotFoundException("Event", request.Id);

        if (entity.Status != "DRAFT")
            throw new BadRequestException("Chỉ có thể công bố sự kiện ở trạng thái Nháp.");

        // Validation before publish
        if (!entity.Sessions.Any())
            throw new BadRequestException("Sự kiện chưa có phiên nào.");
        if (!entity.EventLocations.Any())
            throw new BadRequestException("Sự kiện chưa có hội trường nào.");
        if (!entity.Sessions.SelectMany(s => s.AttendanceRules).Any())
            throw new BadRequestException("Sự kiện chưa có quy tắc điểm danh nào.");
        
        entity.Status = "PUBLISHED";
        
        await _context.SaveChangesAsync(cancellationToken);
    }
}
