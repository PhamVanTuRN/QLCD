using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Locations.DTOs;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Locations.Queries;

public class GetLocationDetailQuery : IRequest<LocationDto>
{
    public Guid Id { get; set; }
}

public class GetLocationDetailQueryHandler : IRequestHandler<GetLocationDetailQuery, LocationDto>
{
    private readonly IAttendanceDbContext _context;

    public GetLocationDetailQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<LocationDto> Handle(GetLocationDetailQuery request, CancellationToken cancellationToken)
    {
        var location = await _context.Locations
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (location == null)
            throw new NotFoundException("Location", request.Id);

        return new LocationDto
        {
            Id = location.Id,
            Code = location.Code,
            Name = location.Name,
            Description = location.Description,
            PhysicalLocation = location.PhysicalLocation,
            Capacity = location.Capacity,
            IsActive = location.IsActive
        };
    }
}
