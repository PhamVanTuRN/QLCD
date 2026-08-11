using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Events.Commands;

public class DuplicateEventCommand : IRequest<Guid>
{
    public Guid Id { get; set; }
}

public class DuplicateEventCommandHandler : IRequestHandler<DuplicateEventCommand, Guid>
{
    private readonly IAttendanceDbContext _context;

    public DuplicateEventCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(DuplicateEventCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Events
            .Include(e => e.Sessions).ThenInclude(s => s.AttendanceRules)
            .Include(e => e.EventLocations)
            .Include(e => e.EventDevices)
            .Include(e => e.Participants)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            throw new NotFoundException("Event", request.Id);

        var newEvent = new Event
        {
            Code = entity.Code + "_COPY_" + DateTime.Now.ToString("yyMMddHHmm"),
            Name = entity.Name + " (Bản sao)",
            Description = entity.Description,
            EventType = entity.EventType,
            Status = "DRAFT",
            Organizer = entity.Organizer,
            ContactPerson = entity.ContactPerson,
            Notes = entity.Notes,
            IsActive = true
        };

        foreach (var session in entity.Sessions)
        {
            var newSession = new EventSession
            {
                SessionName = session.SessionName,
                Date = session.Date,
                StartTime = session.StartTime,
                EndTime = session.EndTime,
                DisplayOrder = session.DisplayOrder
            };

            foreach (var rule in session.AttendanceRules)
            {
                newSession.AttendanceRules.Add(new AttendanceRule
                {
                    AttendanceType = rule.AttendanceType,
                    WindowStart = rule.WindowStart,
                    ReferenceTime = rule.ReferenceTime,
                    WindowEnd = rule.WindowEnd,
                    Required = rule.Required
                });
            }
            newEvent.Sessions.Add(newSession);
        }

        foreach (var loc in entity.EventLocations)
        {
            newEvent.EventLocations.Add(new EventLocation { LocationId = loc.LocationId });
        }

        foreach (var dev in entity.EventDevices)
        {
            newEvent.EventDevices.Add(new EventDevice { DeviceId = dev.DeviceId, LocationId = dev.LocationId });
        }

        foreach (var p in entity.Participants)
        {
            newEvent.Participants.Add(new EventParticipant
            {
                ParticipantType = p.ParticipantType,
                PersonId = p.PersonId,
                DepartmentId = p.DepartmentId
            });
        }

        _context.Events.Add(newEvent);
        await _context.SaveChangesAsync(cancellationToken);

        return newEvent.Id;
    }
}
