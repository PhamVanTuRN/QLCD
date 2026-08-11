using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.Devices.Commands;

public class UpdateDeviceCommand : IRequest
{
    public Guid Id { get; set; }
    public Guid LocationId { get; set; }
    public required string DeviceCode { get; set; }
    public required string DeviceName { get; set; }
    public required string DeviceType { get; set; }
    public string? IPAddress { get; set; }
    public string? DeviceIdentifier { get; set; }
    public string? SerialNumber { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateDeviceCommandValidator : AbstractValidator<UpdateDeviceCommand>
{
    public UpdateDeviceCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.LocationId).NotEmpty();
        RuleFor(x => x.DeviceCode).NotEmpty().MaximumLength(100);
        RuleFor(x => x.DeviceName).NotEmpty().MaximumLength(250);
        RuleFor(x => x.DeviceType).NotEmpty().MaximumLength(50);
    }
}

public class UpdateDeviceCommandHandler : IRequestHandler<UpdateDeviceCommand>
{
    private readonly IAttendanceDbContext _context;

    public UpdateDeviceCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UpdateDeviceCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.AttendanceDevices.FindAsync(new object[] { request.Id }, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("Device", request.Id);
        }

        if (!await _context.Locations.AnyAsync(x => x.Id == request.LocationId, cancellationToken))
        {
            throw new NotFoundException("Location", request.LocationId);
        }

        if (entity.DeviceCode != request.DeviceCode && await _context.AttendanceDevices.AnyAsync(x => x.DeviceCode == request.DeviceCode, cancellationToken))
        {
            throw new BadRequestException($"Device with code {request.DeviceCode} already exists.");
        }

        entity.LocationId = request.LocationId;
        entity.DeviceCode = request.DeviceCode;
        entity.DeviceName = request.DeviceName;
        entity.DeviceType = request.DeviceType;
        entity.IPAddress = request.IPAddress;
        entity.DeviceIdentifier = request.DeviceIdentifier;
        entity.SerialNumber = request.SerialNumber;
        entity.Description = request.Description;
        entity.IsActive = request.IsActive;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
