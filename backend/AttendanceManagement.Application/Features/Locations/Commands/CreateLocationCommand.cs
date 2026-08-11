using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.Locations.Commands;

public class CreateLocationCommand : IRequest<Guid>
{
    public required string Code { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public string? PhysicalLocation { get; set; }
    public int Capacity { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreateLocationCommandValidator : AbstractValidator<CreateLocationCommand>
{
    public CreateLocationCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(250);
        RuleFor(x => x.Capacity).GreaterThanOrEqualTo(0);
    }
}

public class CreateLocationCommandHandler : IRequestHandler<CreateLocationCommand, Guid>
{
    private readonly IAttendanceDbContext _context;

    public CreateLocationCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateLocationCommand request, CancellationToken cancellationToken)
    {
        if (await _context.Locations.AnyAsync(x => x.Code == request.Code, cancellationToken))
        {
            throw new BadRequestException($"Location with code {request.Code} already exists.");
        }

        var entity = new Location
        {
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            PhysicalLocation = request.PhysicalLocation,
            Capacity = request.Capacity,
            IsActive = request.IsActive
        };

        _context.Locations.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return entity.Id;
    }
}
