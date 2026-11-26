using System.Data;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Auth.Commands.Login;

public sealed class LoginAttemptGuard(IQLCDDbContext database, TimeProvider clock)
{
    private const int MaximumFailures = 5;
    private static readonly SemaphoreSlim[] LocalLocks = Enumerable.Range(0, 64)
        .Select(_ => new SemaphoreSlim(1)).ToArray();

    public static string AccountKey(Guid id) => $"A:{id:N}";
    public static string UnknownKey(string username) => $"U:{Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(username)))}";

    public async Task<LoginAttemptResult<T>> RunAsync<T>(string key, Func<Attempt, Task<T?>> operation, CancellationToken ct) where T : class
    {
        var localLock = database.Database.IsRelational() ? null : LocalLocks[(uint)StringComparer.Ordinal.GetHashCode(key) % LocalLocks.Length];
        if (localLock is not null) await localLock.WaitAsync(ct);
        try
        {
            await using var transaction = localLock is null
                ? await database.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, ct) : null;
            if (transaction is not null)
            {
                // Account-scoped transaction lock also serializes the first insert and requests from other API instances.
                await database.Database.ExecuteSqlInterpolatedAsync($"""
                    DECLARE @result int;
                    EXEC @result = sys.sp_getapplock @Resource = {"QLCD.Login:" + key}, @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction', @LockTimeout = 10000;
                    IF @result < 0 THROW 51000, 'Could not acquire login state lock.', 1;
                    """, ct);
            }

            var now = clock.GetUtcNow().UtcDateTime;
            var row = await database.LoginAttempts.FindAsync([key], ct);
            if (row?.LockoutEndUtc > now) return new(null, row.LockoutEndUtc);
            if (row?.LockoutEndUtc is not null)
            {
                row.FailedLoginAttempts = 0;
                row.LockoutEndUtc = null;
            }

            var attempt = new Attempt(database, key, row, now);
            var value = await operation(attempt);
            await database.SaveChangesAsync(ct);
            if (transaction is not null) await transaction.CommitAsync(ct);
            return new(value, attempt.LockoutEndUtc);
        }
        finally { localLock?.Release(); }
    }

    public sealed class Attempt(IQLCDDbContext database, string key, LoginAttempt? row, DateTime now)
    {
        public DateTime? LockoutEndUtc => row?.LockoutEndUtc;

        public void Fail(Guid? accountId, string? trace)
        {
            if (row is null)
            {
                row = new LoginAttempt { Key = key };
                database.LoginAttempts.Add(row);
            }
            row.LastFailureUtc = now;
            if (++row.FailedLoginAttempts >= MaximumFailures)
                row.LockoutEndUtc = now.AddMinutes(10);
            if (accountId is Guid id)
            {
                database.AuditLogs.Add(AccountCredentials.Event(id, id, "AUTH_LOGIN_FAILED", trace));
                if (row.LockoutEndUtc is not null)
                    database.AuditLogs.Add(AccountCredentials.Event(id, id, "AUTH_LOGIN_LOCKOUT", trace));
            }
        }

        public void CompleteSignIn()
        {
            if (row is null) return;
            database.LoginAttempts.Remove(row);
            row = null;
        }
    }
}

public sealed record LoginAttemptResult<T>(T? Value, DateTime? LockoutEndUtc)
{
    public int? RetryAfterSeconds(DateTime now) => LockoutEndUtc is DateTime end
        ? Math.Max(1, (int)Math.Ceiling((end - now).TotalSeconds)) : null;
}
