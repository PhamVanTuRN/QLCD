using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.AttendanceResults.DTOs;
using AttendanceManagement.Shared.Models;

namespace AttendanceManagement.Application.Features.AttendanceResults.Queries;

public class GetAttendanceResultsQuery : IRequest<PagedResult<AttendanceResultDto>>
{
    public Guid? EventId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    public string? AttendanceStatus { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetAttendanceResultsQueryHandler : IRequestHandler<GetAttendanceResultsQuery, PagedResult<AttendanceResultDto>>
{
    private readonly IAttendanceDbContext _context;

    public GetAttendanceResultsQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AttendanceResultDto>> Handle(GetAttendanceResultsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AttendanceResults.AsQueryable();

        if (request.EventId.HasValue)
            query = query.Where(x => x.EventId == request.EventId.Value);

        if (request.PersonId.HasValue)
            query = query.Where(x => x.PersonId == request.PersonId.Value);

        if (!string.IsNullOrEmpty(request.CCCD))
            query = query.Where(x => x.CCCD == request.CCCD);

        if (!string.IsNullOrEmpty(request.AttendanceStatus))
            query = query.Where(x => x.AttendanceStatus == request.AttendanceStatus);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.CCCD)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AttendanceResultDto
            {
                Id = x.Id,
                EventId = x.EventId,
                PersonId = x.PersonId,
                CCCD = x.CCCD,
                FirstAttendanceTime = x.FirstAttendanceTime,
                LastAttendanceTime = x.LastAttendanceTime,
                TotalLogs = x.TotalLogs,
                ValidLogs = x.ValidLogs,
                CompletedRequiredWindows = x.CompletedRequiredWindows,
                RequiredWindows = x.RequiredWindows,
                AttendanceStatus = x.AttendanceStatus,
                ResultReason = x.ResultReason,
                CalculatedAt = x.CalculatedAt,
                IsManualOverride = x.IsManualOverride,
                ManualOverrideReason = x.ManualOverrideReason
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AttendanceResultDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
