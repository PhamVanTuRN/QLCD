using System;
using System.Threading;
using System.Threading.Tasks;

namespace AttendanceManagement.Application.Common.Interfaces;

public interface IAttendanceCalculationService
{
    Task CalculateAttendanceResultAsync(Guid eventId, string cccd, CancellationToken cancellationToken);
    Task CalculateAttendanceResultForPersonAsync(Guid eventId, Guid personId, CancellationToken cancellationToken);
    Task CalculateAllResultsForEventAsync(Guid eventId, CancellationToken cancellationToken);
}
