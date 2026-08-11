using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Events.DTOs;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Events.Queries;

public class GetEventDetailQuery : IRequest<EventDto>
{
    public Guid Id { get; set; }
}

public class GetEventDetailQueryHandler : IRequestHandler<GetEventDetailQuery, EventDto>
{
    private readonly IAttendanceDbContext _context;

    public GetEventDetailQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<EventDto> Handle(GetEventDetailQuery request, CancellationToken cancellationToken)
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

        var dto = new EventDto
        {
            Id = entity.Id,
            Code = entity.Code,
            Name = entity.Name,
            Description = entity.Description,
            EventType = entity.EventType,
            Status = entity.Status,
            Organizer = entity.Organizer,
            ContactPerson = entity.ContactPerson,
            Notes = entity.Notes,
            CreatedDate = entity.CreatedDate,
            CreatedBy = entity.CreatedBy,
            LocationIds = entity.EventLocations.Select(l => l.LocationId).ToList(),
            DeviceIds = entity.EventDevices.Select(d => d.DeviceId).ToList(),
            Sessions = entity.Sessions.OrderBy(s => s.DisplayOrder).Select(s => new EventSessionDto
            {
                SessionName = s.SessionName,
                Date = s.Date,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DisplayOrder = s.DisplayOrder,
                Rules = s.AttendanceRules.Select(r => new AttendanceRuleDto
                {
                    AttendanceType = r.AttendanceType,
                    WindowStart = r.WindowStart,
                    ReferenceTime = r.ReferenceTime,
                    WindowEnd = r.WindowEnd,
                    Required = r.Required
                }).ToList()
            }).ToList()
        };

        var firstParticipant = entity.Participants.FirstOrDefault();
        if (firstParticipant != null)
        {
            dto.ParticipantConfig.ParticipantType = firstParticipant.ParticipantType;
            if (firstParticipant.ParticipantType == "BY_DEPARTMENT")
            {
                dto.ParticipantConfig.DepartmentIds = entity.Participants
                    .Where(p => p.DepartmentId.HasValue)
                    .Select(p => p.DepartmentId!.Value)
                    .ToList();
            }
            else if (firstParticipant.ParticipantType == "SPECIFIC_PERSONS")
            {
                dto.ParticipantConfig.PersonIds = entity.Participants
                    .Where(p => p.PersonId.HasValue)
                    .Select(p => p.PersonId!.Value)
                    .ToList();
            }
        }
        else
        {
            dto.ParticipantConfig.ParticipantType = "NO_PREDEFINED_LIST";
        }

        return dto;
    }
}
