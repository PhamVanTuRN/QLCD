using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Exceptions;
using FluentValidation;

namespace AttendanceManagement.Application.Features.AttendanceResults.Commands;

public class ManualOverrideResultCommand : IRequest
{
    public Guid Id { get; set; }
    public required string AttendanceStatus { get; set; }
    public string? ManualOverrideReason { get; set; }
}

public class ManualOverrideResultCommandValidator : AbstractValidator<ManualOverrideResultCommand>
{
    public ManualOverrideResultCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.AttendanceStatus).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ManualOverrideReason).NotEmpty().When(x => !string.IsNullOrEmpty(x.AttendanceStatus));
    }
}

public class ManualOverrideResultCommandHandler : IRequestHandler<ManualOverrideResultCommand>
{
    private readonly IAttendanceDbContext _context;

    public ManualOverrideResultCommandHandler(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task Handle(ManualOverrideResultCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.AttendanceResults.FindAsync(new object[] { request.Id }, cancellationToken);

        if (entity == null)
        {
            throw new NotFoundException("AttendanceResult", request.Id);
        }

        entity.IsManualOverride = true;
        entity.AttendanceStatus = request.AttendanceStatus;
        entity.ManualOverrideReason = request.ManualOverrideReason;
        entity.CalculatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
