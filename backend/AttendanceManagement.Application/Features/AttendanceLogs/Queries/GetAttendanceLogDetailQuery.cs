using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.AttendanceLogs.DTOs;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.AttendanceLogs.Queries;

public class GetAttendanceLogDetailQuery : IRequest<AttendanceLogDto>
{
    public Guid Id { get; set; }
}

public class GetAttendanceLogDetailQueryHandler : IRequestHandler<GetAttendanceLogDetailQuery, AttendanceLogDto>
{
    private readonly IAttendanceDbContext _context;

    public GetAttendanceLogDetailQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<AttendanceLogDto> Handle(GetAttendanceLogDetailQuery request, CancellationToken cancellationToken)
    {
        var log = await _context.RawAttendanceLogs
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (log == null)
            throw new NotFoundException("RawAttendanceLog", request.Id);

        return new AttendanceLogDto
        {
            Id = log.Id,
            EventId = log.EventId,
            DeviceId = log.DeviceId,
            LocationId = log.LocationId,
            PersonId = log.PersonId,
            CCCD = log.CCCD,
            AttendanceTime = log.AttendanceTime,
            AttendanceMethod = log.AttendanceMethod,
            RecognitionScore = log.RecognitionScore,
            IsValid = log.IsValid,
            ValidationMessage = log.ValidationMessage,
            RawPayload = log.RawPayload
        };
    }
}
