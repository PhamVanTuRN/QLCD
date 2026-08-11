using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.AttendanceLogs.DTOs;
using AttendanceManagement.Shared.Models;

namespace AttendanceManagement.Application.Features.AttendanceLogs.Queries;

public class GetAttendanceLogsQuery : IRequest<PagedResult<AttendanceLogDto>>
{
    public Guid? EventId { get; set; }
    public Guid? DeviceId { get; set; }
    public Guid? LocationId { get; set; }
    public Guid? PersonId { get; set; }
    public string? CCCD { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? AttendanceMethod { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}

public class GetAttendanceLogsQueryHandler : IRequestHandler<GetAttendanceLogsQuery, PagedResult<AttendanceLogDto>>
{
    private readonly IAttendanceDbContext _context;

    public GetAttendanceLogsQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AttendanceLogDto>> Handle(GetAttendanceLogsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.RawAttendanceLogs.AsQueryable();

        if (request.EventId.HasValue)
            query = query.Where(x => x.EventId == request.EventId.Value);
            
        if (request.DeviceId.HasValue)
            query = query.Where(x => x.DeviceId == request.DeviceId.Value);
            
        if (request.LocationId.HasValue)
            query = query.Where(x => x.LocationId == request.LocationId.Value);

        if (request.PersonId.HasValue)
            query = query.Where(x => x.PersonId == request.PersonId.Value);

        if (!string.IsNullOrEmpty(request.CCCD))
            query = query.Where(x => x.CCCD == request.CCCD);

        if (request.FromDate.HasValue)
            query = query.Where(x => x.AttendanceTime >= request.FromDate.Value);

        if (request.ToDate.HasValue)
            query = query.Where(x => x.AttendanceTime <= request.ToDate.Value);

        if (!string.IsNullOrEmpty(request.AttendanceMethod))
            query = query.Where(x => x.AttendanceMethod == request.AttendanceMethod);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.AttendanceTime)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new AttendanceLogDto
            {
                Id = x.Id,
                EventId = x.EventId,
                DeviceId = x.DeviceId,
                LocationId = x.LocationId,
                PersonId = x.PersonId,
                CCCD = x.CCCD,
                AttendanceTime = x.AttendanceTime,
                AttendanceMethod = x.AttendanceMethod,
                RecognitionScore = x.RecognitionScore,
                IsValid = x.IsValid,
                ValidationMessage = x.ValidationMessage,
                RawPayload = x.RawPayload
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AttendanceLogDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
