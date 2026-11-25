using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using QLCD.Infrastructure.Data;

namespace QLCD.Api.Security;

public sealed class DatabaseReadiness(IServiceScopeFactory scopes) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        await using var scope = scopes.CreateAsyncScope();
        var database = scope.ServiceProvider.GetRequiredService<QLCDDbContext>();
        if (!database.Database.IsRelational())
            return HealthCheckResult.Healthy();

        if (!await database.Database.CanConnectAsync(cancellationToken)
            || (await database.Database.GetPendingMigrationsAsync(cancellationToken)).Any())
            return HealthCheckResult.Unhealthy("Database is unavailable or needs migration.");

        return HealthCheckResult.Healthy();
    }
}
