using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Application.Features.Devices.DTOs;
using AttendanceManagement.Shared.Exceptions;

namespace AttendanceManagement.Application.Features.Devices.Queries;

public class GetDeviceDetailQuery : IRequest<DeviceDto>
{
    public Guid Id { get; set; }
}

public class GetDeviceDetailQueryHandler : IRequestHandler<GetDeviceDetailQuery, DeviceDto>
{
    private readonly IAttendanceDbContext _context;

    public GetDeviceDetailQueryHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<DeviceDto> Handle(GetDeviceDetailQuery request, CancellationToken cancellationToken)
    {
        var device = await _context.AttendanceDevices
            .Include(x => x.Location)
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (device == null)
            throw new NotFoundException("Device", request.Id);

        return new DeviceDto
        {
            Id = device.Id,
            LocationId = device.LocationId,
            LocationName = device.Location.Name,
            DeviceCode = device.DeviceCode,
            DeviceName = device.DeviceName,
            DeviceType = device.DeviceType,
            IPAddress = device.IPAddress,
            DeviceIdentifier = device.DeviceIdentifier,
            SerialNumber = device.SerialNumber,
            Description = device.Description,
            IsActive = device.IsActive,
            LastOnlineAt = device.LastOnlineAt
        };
    }
}
