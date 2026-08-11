using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.Events.Commands;

public class UpdateEventCommand : IRequest
{
    public Guid Id { get; set; }
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? EventType { get; set; }
    public string? Organizer { get; set; }
    public string? ContactPerson { get; set; }
    public string? Notes { get; set; }

    public List<EventSessionDto> Sessions { get; set; } = new();
    public List<Guid> LocationIds { get; set; } = new();
    public List<Guid> DeviceIds { get; set; } = new();
    
    public ParticipantConfigDto ParticipantConfig { get; set; } = new() { ParticipantType = "NO_PREDEFINED_LIST" };
}

public class UpdateEventCommandValidator : AbstractValidator<UpdateEventCommand>
{
    public UpdateEventCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(250);
        RuleFor(x => x.Sessions).NotEmpty().WithMessage("Sự kiện phải có ít nhất 1 phiên");
        RuleFor(x => x.LocationIds).NotEmpty().WithMessage("Sự kiện phải có ít nhất 1 hội trường");

        RuleForEach(x => x.Sessions).ChildRules(sessions =>
        {
            sessions.RuleFor(s => s.StartTime)
                .LessThan(s => s.EndTime)
                .WithMessage("Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc");

            sessions.RuleForEach(s => s.Rules).ChildRules(rules =>
            {
                rules.RuleFor(r => r.ReferenceTime)
                    .GreaterThanOrEqualTo(r => r.WindowStart)
                    .WithMessage("Thời gian mốc (chuẩn) phải >= thời gian mở");
                
                rules.RuleFor(r => r.ReferenceTime)
                    .LessThanOrEqualTo(r => r.WindowEnd)
                    .WithMessage("Thời gian mốc (chuẩn) phải <= thời gian đóng");
            });
        });
    }
}

public class UpdateEventCommandHandler : IRequestHandler<UpdateEventCommand>
{
    private readonly IAttendanceDbContext _context;

    public UpdateEventCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateEventCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.Events
            .Include(e => e.Sessions).ThenInclude(s => s.AttendanceRules)
            .Include(e => e.EventLocations)
            .Include(e => e.EventDevices)
            .Include(e => e.Participants)
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
            throw new NotFoundException("Event", request.Id);

        if (entity.Status == "LOCKED")
            throw new BadRequestException("Cannot edit a locked event.");

        if (await _context.Events.AnyAsync(x => x.Code == request.Code && x.Id != request.Id, cancellationToken))
            throw new BadRequestException($"Event with code {request.Code} already exists.");

        // Conflict Checking
        var locationIds = request.LocationIds.Distinct().ToList();
        var deviceIds = request.DeviceIds.Distinct().ToList();

        foreach (var s in request.Sessions)
        {
            var conflictingEvent = await _context.Events
                .Where(e => e.Id != request.Id && !e.IsDeleted && e.Status != "CANCELLED")
                .Where(e => e.Sessions.Any(es =>
                    es.Date.Date == s.Date.Date &&
                    ((es.StartTime <= s.StartTime && es.EndTime > s.StartTime) ||
                     (es.StartTime < s.EndTime && es.EndTime >= s.EndTime) ||
                     (es.StartTime >= s.StartTime && es.EndTime <= s.EndTime))
                ))
                .Where(e => e.EventLocations.Any(el => locationIds.Contains(el.LocationId)) ||
                            e.EventDevices.Any(ed => deviceIds.Contains(ed.DeviceId)))
                .FirstOrDefaultAsync(cancellationToken);

            if (conflictingEvent != null)
            {
                throw new BadRequestException($"Phát hiện trùng lịch với sự kiện '{conflictingEvent.Name}' (Mã: {conflictingEvent.Code}) trong phiên ngày {s.Date:dd/MM/yyyy} từ {s.StartTime} đến {s.EndTime} tại các địa điểm/thiết bị đã chọn.");
            }
        }

        // Update properties
        entity.Code = request.Code;
        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.EventType = request.EventType;
        entity.Organizer = request.Organizer;
        entity.ContactPerson = request.ContactPerson;
        entity.Notes = request.Notes;

        // 1. Update Locations
        _context.EventLocations.RemoveRange(entity.EventLocations);
        foreach (var locId in request.LocationIds.Distinct())
        {
            entity.EventLocations.Add(new EventLocation { LocationId = locId });
        }

        // 2. Update Devices
        _context.EventDevices.RemoveRange(entity.EventDevices);
        if (deviceIds.Any())
        {
            var devices = await _context.AttendanceDevices
                .Where(d => deviceIds.Contains(d.Id) && !d.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var devId in deviceIds)
            {
                var device = devices.FirstOrDefault(d => d.Id == devId);
                if (device != null)
                {
                    entity.EventDevices.Add(new EventDevice { DeviceId = devId, LocationId = device.LocationId });
                }
            }
        }

        // 3. Update Sessions and Rules
        _context.EventSessions.RemoveRange(entity.Sessions);
        foreach (var s in request.Sessions)
        {
            var session = new EventSession
            {
                SessionName = s.SessionName,
                Date = s.Date,
                StartTime = s.StartTime,
                EndTime = s.EndTime,
                DisplayOrder = s.DisplayOrder
            };

            foreach (var r in s.Rules)
            {
                session.AttendanceRules.Add(new AttendanceRule
                {
                    AttendanceType = r.AttendanceType,
                    WindowStart = r.WindowStart,
                    ReferenceTime = r.ReferenceTime,
                    WindowEnd = r.WindowEnd,
                    Required = r.Required
                });
            }

            entity.Sessions.Add(session);
        }

        // 4. Update Participants
        _context.EventParticipants.RemoveRange(entity.Participants);
        if (request.ParticipantConfig.ParticipantType == "BY_DEPARTMENT")
        {
            foreach (var depId in request.ParticipantConfig.DepartmentIds.Distinct())
            {
                entity.Participants.Add(new EventParticipant
                {
                    ParticipantType = "BY_DEPARTMENT",
                    DepartmentId = depId
                });
            }
        }
        else if (request.ParticipantConfig.ParticipantType == "SPECIFIC_PERSONS")
        {
            foreach (var pId in request.ParticipantConfig.PersonIds.Distinct())
            {
                entity.Participants.Add(new EventParticipant
                {
                    ParticipantType = "SPECIFIC_PERSONS",
                    PersonId = pId
                });
            }
        }
        else
        {
            entity.Participants.Add(new EventParticipant
            {
                ParticipantType = request.ParticipantConfig.ParticipantType
            });
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
