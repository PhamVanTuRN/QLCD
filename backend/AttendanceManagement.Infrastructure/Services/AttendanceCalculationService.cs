using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Entities;

namespace AttendanceManagement.Infrastructure.Services;

public class AttendanceCalculationService : IAttendanceCalculationService
{
    private readonly IAttendanceDbContext _context;

    public AttendanceCalculationService(IAttendanceDbContext context)
    {
        _context = context;
    }

    public async Task CalculateAttendanceResultAsync(Guid eventId, string cccd, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(cccd)) return;
        
        await ProcessCalculationAsync(eventId, null, cccd, cancellationToken);
    }

    public async Task CalculateAttendanceResultForPersonAsync(Guid eventId, Guid personId, CancellationToken cancellationToken)
    {
        await ProcessCalculationAsync(eventId, personId, null, cancellationToken);
    }

    public async Task CalculateAllResultsForEventAsync(Guid eventId, CancellationToken cancellationToken)
    {
        var distinctParticipants = await _context.RawAttendanceLogs
            .Where(x => x.EventId == eventId && x.IsValid)
            .Select(x => new { x.PersonId, x.CCCD })
            .Distinct()
            .ToListAsync(cancellationToken);

        foreach (var p in distinctParticipants)
        {
            if (p.PersonId.HasValue)
            {
                await ProcessCalculationAsync(eventId, p.PersonId.Value, null, cancellationToken);
            }
            else if (!string.IsNullOrEmpty(p.CCCD))
            {
                await ProcessCalculationAsync(eventId, null, p.CCCD, cancellationToken);
            }
        }
    }

    private async Task ProcessCalculationAsync(Guid eventId, Guid? personId, string? cccd, CancellationToken cancellationToken)
    {
        var query = _context.RawAttendanceLogs
            .Where(x => x.EventId == eventId && x.IsValid);

        if (personId.HasValue)
            query = query.Where(x => x.PersonId == personId.Value);
        else if (!string.IsNullOrEmpty(cccd))
            query = query.Where(x => x.CCCD == cccd);
        else
            return; // Needs at least personId or CCCD

        var logs = await query
            .OrderBy(x => x.AttendanceTime)
            .ToListAsync(cancellationToken);

        if (!logs.Any()) return;

        var resultQuery = _context.AttendanceResults
            .Where(x => x.EventId == eventId);

        if (personId.HasValue)
            resultQuery = resultQuery.Where(x => x.PersonId == personId.Value);
        else if (!string.IsNullOrEmpty(cccd))
            resultQuery = resultQuery.Where(x => x.CCCD == cccd);

        var result = await resultQuery.FirstOrDefaultAsync(cancellationToken);
        
        bool isNew = false;
        if (result == null)
        {
            isNew = true;
            result = new AttendanceResult
            {
                EventId = eventId,
                PersonId = personId,
                CCCD = cccd,
                UserId = logs.FirstOrDefault(x => x.UserId.HasValue)?.UserId,
                AttendanceStatus = "PENDING"
            };
        }

        if (result.IsManualOverride) return; // Do not recalculate if manually overridden

        result.FirstAttendanceTime = logs.First().AttendanceTime;
        result.LastAttendanceTime = logs.Last().AttendanceTime;
        result.TotalLogs = logs.Count;
        result.ValidLogs = logs.Count; // Assuming query already filters IsValid == true
        result.CalculatedAt = DateTime.UtcNow;

        // TODO: Re-implement attendance calculation logic based on new EventSession and AttendanceRule structure
        // var rules = await _context.EventSessions.SelectMany(s => s.AttendanceRules).ToListAsync(cancellationToken);
        
        result.AttendanceStatus = "PRESENT";
        result.ResultReason = "Calculated based on raw logs";
        if (isNew)
        {
            _context.AttendanceResults.Add(result);
        }
        else
        {
            _context.AttendanceResults.Update(result);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
