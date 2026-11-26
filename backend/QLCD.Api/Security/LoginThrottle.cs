using System.Threading.RateLimiting;

namespace QLCD.Api.Security;

public sealed class LoginThrottle : IDisposable
{
    public const string Policy = "login";
    public const string FactorPolicy = "login-factor";

    private readonly PartitionedRateLimiter<string> limiter = PartitionedRateLimiter.Create<string, string>(
        username => RateLimitPartition.GetSlidingWindowLimiter(username, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(5),
            SegmentsPerWindow = 5
        }));

    public bool TryAcquireAuthenticatorChange(Guid accountId, string operation = "setup")
    {
        using var lease = limiter.AttemptAcquire($"mfa-settings:{operation}:{accountId:N}");
        return lease.IsAcquired;
    }

    public void Dispose() => limiter.Dispose();
}
