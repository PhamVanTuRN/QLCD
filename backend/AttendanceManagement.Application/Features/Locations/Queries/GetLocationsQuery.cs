using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Locations.DTOs;
using AttendanceManagement.Shared.Models;

namespace AttendanceManagement.Application.Features.Locations.Queries;

public class GetLocationsQuery : IRequest<PagedResult<LocationDto>>
{
    public string? SearchKeyword { get; set; }
    public bool? IsActive { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetLocationsQueryHandler : IRequestHandler<GetLocationsQuery, PagedResult<LocationDto>>
{
    private readonly IAttendanceDbContext _context;

    public GetLocationsQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<LocationDto>> Handle(GetLocationsQuery request, CancellationToken cancellationToken)
    {
        var query = _context.Locations.AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchKeyword))
        {
            var keyword = request.SearchKeyword.ToLower();
            query = query.Where(x => x.Code.ToLower().Contains(keyword) || 
                                     x.Name.ToLower().Contains(keyword));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.Code)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new LocationDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                Description = x.Description,
                PhysicalLocation = x.PhysicalLocation,
                Capacity = x.Capacity,
                IsActive = x.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<LocationDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
