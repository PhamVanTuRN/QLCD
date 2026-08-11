using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.AttendanceResults.DTOs;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.AttendanceResults.Queries;

public class GetAttendanceResultDetailQuery : IRequest<AttendanceResultDto>
{
    public Guid Id { get; set; }
}

public class GetAttendanceResultDetailQueryHandler : IRequestHandler<GetAttendanceResultDetailQuery, AttendanceResultDto>
{
    private readonly IAttendanceDbContext _context;

    public GetAttendanceResultDetailQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<AttendanceResultDto> Handle(GetAttendanceResultDetailQuery request, CancellationToken cancellationToken)
    {
        var result = await _context.AttendanceResults
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (result == null)
            throw new NotFoundException("AttendanceResult", request.Id);

        return new AttendanceResultDto
        {
            Id = result.Id,
            EventId = result.EventId,
            PersonId = result.PersonId,
            CCCD = result.CCCD,
            FirstAttendanceTime = result.FirstAttendanceTime,
            LastAttendanceTime = result.LastAttendanceTime,
            TotalLogs = result.TotalLogs,
            ValidLogs = result.ValidLogs,
            CompletedRequiredWindows = result.CompletedRequiredWindows,
            RequiredWindows = result.RequiredWindows,
            AttendanceStatus = result.AttendanceStatus,
            ResultReason = result.ResultReason,
            CalculatedAt = result.CalculatedAt,
            IsManualOverride = result.IsManualOverride,
            ManualOverrideReason = result.ManualOverrideReason
        };
    }
}
