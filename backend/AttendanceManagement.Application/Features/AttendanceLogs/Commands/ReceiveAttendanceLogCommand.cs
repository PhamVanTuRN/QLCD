using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.AttendanceLogs.Commands;

public class ReceiveAttendanceLogCommand : IRequest<Guid>
{
    public Guid? EventId { get; set; }
    public Guid DeviceId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    public DateTime AttendanceTime { get; set; }
    public string AttendanceMethod { get; set; } = string.Empty;
    public decimal? RecognitionScore { get; set; }
    public bool IsValid { get; set; } = true;
    public string? ValidationMessage { get; set; }
    public string? RawPayload { get; set; }
}

public class ReceiveAttendanceLogCommandValidator : AbstractValidator<ReceiveAttendanceLogCommand>
{
    public ReceiveAttendanceLogCommandValidator()
    {
        RuleFor(x => x.DeviceId).NotEmpty();
        RuleFor(x => x.AttendanceTime).NotEmpty();
        RuleFor(x => x.AttendanceMethod).NotEmpty().MaximumLength(50);
    }
}

public class ReceiveAttendanceLogCommandHandler : IRequestHandler<ReceiveAttendanceLogCommand, Guid>
{
    private readonly IAttendanceDbContext _context;
    private readonly IAttendanceCalculationService _calculationService;

    public ReceiveAttendanceLogCommandHandler(IAttendanceDbContext context, IAttendanceCalculationService calculationService)
    {
        _context = context;
        _calculationService = calculationService;
    }

    public async Task<Guid> Handle(ReceiveAttendanceLogCommand request, CancellationToken cancellationToken)
    {
            var device = await _context.AttendanceDevices
                .FirstOrDefaultAsync(x => x.Id == request.DeviceId, cancellationToken);
            
            if (device == null)
            {
                throw new NotFoundException("AttendanceDevice", request.DeviceId);
            }
            Guid? resolvedEventId = request.EventId;
            Guid resolvedLocationId = device.LocationId;

            // Resolve EventId if not provided
            if (!resolvedEventId.HasValue)
            {
                var activeEvents = await _context.EventLocations
                    .Include(el => el.Event)
                    .Where(el => el.LocationId == resolvedLocationId && 
                                 el.Event.StartTime <= request.AttendanceTime && 
                                 el.Event.EndTime >= request.AttendanceTime &&
                                 !el.Event.IsDeleted)
                    .Select(el => el.EventId)
                    .ToListAsync(cancellationToken);

                if (activeEvents.Count == 1)
                {
                    resolvedEventId = activeEvents.First();
                }
                else if (activeEvents.Count > 1)
                {
                    request.IsValid = false;
                    request.ValidationMessage = "Ambiguous Event: Multiple active events found at this location and time.";
                }
                else
                {
                    request.IsValid = false;
                    request.ValidationMessage = "No active event found at this location and time.";
                }
            }
            else
            {
                if (!await _context.Events.AnyAsync(x => x.Id == resolvedEventId, cancellationToken))
                {
                    throw new NotFoundException("Event", resolvedEventId);
                }
            }

            // Debounce logic (prevent duplicate logs within 10 seconds)
            if (request.IsValid && (!string.IsNullOrEmpty(request.CCCD) || request.PersonId.HasValue))
            {
                var debounceTime = request.AttendanceTime.AddSeconds(-10);
                var isDuplicate = await _context.RawAttendanceLogs
                    .AnyAsync(l => l.DeviceId == request.DeviceId &&
                                   l.AttendanceTime >= debounceTime &&
                                   l.AttendanceTime <= request.AttendanceTime &&
                                   (l.CCCD == request.CCCD || (l.PersonId != null && l.PersonId == request.PersonId)), 
                              cancellationToken);
                
                if (isDuplicate)
                {
                    request.IsValid = false;
                    request.ValidationMessage = "Duplicate log: A log was recorded within the last 10 seconds.";
                }
            }

            var entity = new RawAttendanceLog
            {
                EventId = resolvedEventId,
                DeviceId = request.DeviceId,
                LocationId = request.LocationId ?? resolvedLocationId,
                PersonId = request.PersonId,
                CCCD = request.CCCD,
                AttendanceTime = request.AttendanceTime,
                AttendanceMethod = request.AttendanceMethod,
                RecognitionScore = request.RecognitionScore,
                IsValid = request.IsValid,
                ValidationMessage = request.ValidationMessage,
                RawPayload = request.RawPayload
            };

            _context.RawAttendanceLogs.Add(entity);
            await _context.SaveChangesAsync(cancellationToken);

            // Process calculation asynchronously if the log is valid and we know the event
            if (entity.IsValid && entity.EventId.HasValue)
            {
                if (entity.PersonId.HasValue)
                {
                    await _calculationService.CalculateAttendanceResultForPersonAsync(entity.EventId.Value, entity.PersonId.Value, cancellationToken);
                }
                else if (!string.IsNullOrEmpty(entity.CCCD))
                {
                    await _calculationService.CalculateAttendanceResultAsync(entity.EventId.Value, entity.CCCD, cancellationToken);
                }
            }

            return entity.Id;
    }
}
