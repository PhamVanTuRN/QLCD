using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Devices.DTOs;
using AttendanceManagement.Shared.Models;

namespace AttendanceManagement.Application.Features.Devices.Queries;

public class GetDevicesQuery : IRequest<PagedResult<DeviceDto>>
{
    public string? SearchKeyword { get; set; }
    public Guid? LocationId { get; set; }
    public bool? IsActive { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class GetDevicesQueryHandler : IRequestHandler<GetDevicesQuery, PagedResult<DeviceDto>>
{
    private readonly IAttendanceDbContext _context;

    public GetDevicesQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<DeviceDto>> Handle(GetDevicesQuery request, CancellationToken cancellationToken)
    {
        var query = _context.AttendanceDevices
            .Include(x => x.Location)
            .AsQueryable();

        if (!string.IsNullOrEmpty(request.SearchKeyword))
        {
            var keyword = request.SearchKeyword.ToLower();
            query = query.Where(x => x.DeviceCode.ToLower().Contains(keyword) || 
                                     x.DeviceName.ToLower().Contains(keyword));
        }

        if (request.LocationId.HasValue)
        {
            query = query.Where(x => x.LocationId == request.LocationId.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(x => x.IsActive == request.IsActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderBy(x => x.DeviceCode)
            .Skip((request.PageIndex - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new DeviceDto
            {
                Id = x.Id,
                LocationId = x.LocationId,
                LocationName = x.Location.Name,
                DeviceCode = x.DeviceCode,
                DeviceName = x.DeviceName,
                DeviceType = x.DeviceType,
                IPAddress = x.IPAddress,
                DeviceIdentifier = x.DeviceIdentifier,
                SerialNumber = x.SerialNumber,
                Description = x.Description,
                IsActive = x.IsActive,
                LastOnlineAt = x.LastOnlineAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<DeviceDto>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize
        };
    }
}
