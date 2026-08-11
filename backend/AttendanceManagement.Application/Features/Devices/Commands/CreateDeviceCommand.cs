using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.Devices.Commands;

public class CreateDeviceCommand : IRequest<Guid>
{
    public Guid LocationId { get; set; }
    public required string DeviceCode { get; set; }
    public required string DeviceName { get; set; }
    public required string DeviceType { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceIdentifier { get; set; }
    public string? SerialNumber { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateDeviceCommandValidator : AbstractValidator<CreateDeviceCommand>
{
    public CreateDeviceCommandValidator()
    {
        RuleFor(x => x.LocationId).NotEmpty();
        RuleFor(x => x.DeviceCode).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeviceName).NotEmpty().MaximumLength(250);
        RuleFor(x => x.DeviceType).NotEmpty().MaximumLength(50);
    }
}

public class CreateDeviceCommandHandler : IRequestHandler<CreateDeviceCommand, Guid>
{
    private readonly IAttendanceDbContext _context;

    public CreateDeviceCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateDeviceCommand request, CancellationToken cancellationToken)
    {
        if (!await _context.Locations.AnyAsync(x => x.Id == request.LocationId, cancellationToken))
        {
            throw new NotFoundException("Location", request.LocationId);
        }

        if (await _context.AttendanceDevices.AnyAsync(x => x.DeviceCode == request.DeviceCode, cancellationToken))
        {
            throw new BadRequestException($"Device with code {request.DeviceCode} already exists.");
        }

        var entity = new AttendanceDevice
        {
            LocationId = request.LocationId,
            DeviceCode = request.DeviceCode,
            DeviceName = request.DeviceName,
            DeviceType = request.DeviceType,
            IPAddress = request.IPAddress,
            DeviceIdentifier = request.DeviceIdentifier,
            SerialNumber = request.SerialNumber,
            Description = request.Description,
            IsActive = request.IsActive
        };

        _context.AttendanceDevices.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
