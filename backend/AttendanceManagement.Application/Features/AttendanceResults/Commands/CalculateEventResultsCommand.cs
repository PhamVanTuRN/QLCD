using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using AttendanceManagement.Application.Common.Interfaces;

namespace AttendanceManagement.Application.Features.AttendanceResults.Commands;

public class CalculateEventResultsCommand : IRequest
{
    public Guid EventId { get; set; }
}

public class CalculateEventResultsCommandHandler : IRequestHandler<CalculateEventResultsCommand>
{
    private readonly IAttendanceCalculationService _calculationService;

    public CalculateEventResultsCommandHandler(IAttendanceCalculationService calculationService)
    {
        _calculationService = calculationService;
    }

    public async Task Handle(CalculateEventResultsCommand request, CancellationToken cancellationToken)
    {
        await _calculationService.CalculateAllResultsForEventAsync(request.EventId, cancellationToken);
    }
}
