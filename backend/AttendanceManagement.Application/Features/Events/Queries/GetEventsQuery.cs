using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Events.DTOs;
using AttendanceManagement.Shared.Models;

namespace AttendanceManagement.Application.Features.Events.Queries;

public class GetEventsQuery : IRequest<PagedResult<EventDto>>
{
    public string? SearchKeyword { get; set; }
    public string? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetEventsQueryHandler : IRequestHandler<GetEventsQuery, PagedResult<EventDto>>
{
    private readonly IAttendanceDbContext _context;

    public GetEventsQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<EventDto>> Handle(GetEventsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Events
            .Include(x => x.EventLocations)
            .Include(x => x.Sessions)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchKeyword))
        {
            var keyword = request.SearchKeyword.ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(keyword) || 
                                     x.Name.ToLower().Contains(keyword));
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            query = query.Where(x => x.Status == request.Status);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(x => x.Sessions.Any(s => s.Date >= request.FromDate.Value.Date));
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(x => x.Sessions.Any(s => s.Date <= request.ToDate.Value.Date));
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(x => x.CreatedDate)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new EventDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                EventType = x.EventType,
                Status = x.Status,
                Organizer = x.Organizer,
                ContactPerson = x.ContactPerson,
                Notes = x.Notes,
                CreatedDate = x.CreatedDate,
                CreatedBy = x.CreatedBy,
                LocationIds = x.EventLocations.Select(el => el.LocationId).ToList(),
                Sessions = x.Sessions.Select(s => new EventSessionDto
                {
                    SessionName = s.SessionName,
                    Date = s.Date,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<EventDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
