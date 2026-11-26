using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Entities;
using QLCD.Infrastructure.Data;
using QLCD.Shared.Security;

namespace QLCD.Tests;

public sealed class LoginLockoutTests : IAsyncLifetime
{
    private const string Username = "qlcd_admin";
    private const string Password = "FixturePassword1!";
    private readonly ManualClock clock = new();
    private DbContextOptions<QLCDDbContext> options = null!;
    private Guid adminId;

    public async Task InitializeAsync()
    {
        var builder = new DbContextOptionsBuilder<QLCDDbContext>();
        var connection = Environment.GetEnvironmentVariable("QLCD_TEST_LOGIN_SQL_CONNECTION");
        if (connection is null) builder.UseInMemoryDatabase(Guid.NewGuid().ToString("N"));
        else
        {
            var sql = new SqlConnectionStringBuilder(connection);
            if (!sql.InitialCatalog.StartsWith("QLCD_Test_", StringComparison.Ordinal))
                throw new InvalidOperationException("An isolated test database is required.");
            sql.InitialCatalog = "QLCD_Test_Login_" + Guid.NewGuid().ToString("N");
            builder.UseSqlServer(sql.ConnectionString);
        }
        options = builder.Options;
        await using var db = new QLCDDbContext(options);
        if (db.Database.IsRelational()) await db.Database.MigrateAsync();
        var admin = new TaiKhoan { Username = Username, HoTen = "Fixture admin", VaiTro = "ADMIN",
            PasswordHash = PasswordHasher.Hash(Password), ProtectedMfaSecret = "fixture" };
        adminId = admin.Id;
        db.TaiKhoans.Add(admin);
        await db.SaveChangesAsync();
    }

    public async Task DisposeAsync()
    {
        if (options is null) return;
        await using var db = new QLCDDbContext(options);
        await db.Database.EnsureDeletedAsync();
    }

    [Fact]
    public async Task MixedFailuresUseOneCounterAndBlockBothLoginStepsForExactlyTenMinutes()
    {
        var proof = (await Send(new(Username, Password))).Value!.Proof!;
        for (var i = 0; i < 4; i++)
        {
            var request = i % 2 == 0 ? new LoginCommand(Username, "WrongPassword1!")
                : new LoginCommand(Username, "", "000000") { VerifiedPassword = proof };
            var denied = await Send(request);
            Assert.Null(denied.Value);
            Assert.Null(denied.LockoutEndUtc);
        }
        Assert.NotNull((await Send(new(Username, Password))).Value!.Proof);
        var factor = new LoginCommand(Username, "", "123456") { VerifiedPassword = proof };
        var current = clock.GetUtcNow();
        var fifth = await Send(factor with { MfaCode = "000000" });
        Assert.Equal(current.UtcDateTime.AddMinutes(10), fifth.LockoutEndUtc);
        Assert.Equal(fifth.LockoutEndUtc, (await Send(new(Username, Password))).LockoutEndUtc);
        clock.Advance(TimeSpan.FromMinutes(10) - TimeSpan.FromSeconds(1));
        Assert.Equal(fifth.LockoutEndUtc, (await Send(factor)).LockoutEndUtc);
        clock.Advance(TimeSpan.FromSeconds(1));
        var result = await Send(factor);
        Assert.NotNull(result.Value?.SessionToken);
        Assert.Null(result.LockoutEndUtc);

        await using var db = new QLCDDbContext(options);
        Assert.Empty(await db.LoginAttempts.ToListAsync());
        Assert.True(await db.TaiKhoans.Where(a => a.Id == adminId).Select(a => a.TrangThai && !a.IsDeleted).SingleAsync());
        Assert.Equal(5, await db.AuditLogs.CountAsync(a => a.RecordId == adminId && a.Action == "AUTH_LOGIN_FAILED"));
        Assert.Equal(1, await db.AuditLogs.CountAsync(a => a.RecordId == adminId && a.Action == "AUTH_LOGIN_LOCKOUT"));
    }

    [Fact]
    public async Task ConcurrentOtpFailuresBlockTheFifthAndDoNotExtendTheLock()
    {
        var proof = (await Send(new(Username, Password))).Value!.Proof!;
        var failedOtp = new LoginCommand(Username, "", "000000") { VerifiedPassword = proof };
        var outcomes = await Task.WhenAll(Enumerable.Range(0, 9).Select(_ => Send(failedOtp)));
        Assert.Equal(4, outcomes.Count(outcome => outcome.LockoutEndUtc is null));
        Assert.All(outcomes, outcome => Assert.Null(outcome.Value));
        Assert.All(outcomes.Where(outcome => outcome.LockoutEndUtc is not null),
            outcome => Assert.Equal(clock.GetUtcNow().UtcDateTime.AddMinutes(10), outcome.LockoutEndUtc));
        await using var db = new QLCDDbContext(options);
        Assert.Equal(5, (await db.LoginAttempts.SingleAsync()).FailedLoginAttempts);
        Assert.Empty(await db.AuthSessions.ToListAsync());
        Assert.Equal(5, await db.AuditLogs.CountAsync(a => a.RecordId == adminId && a.Action == "AUTH_LOGIN_FAILED"));
        Assert.Equal(1, await db.AuditLogs.CountAsync(a => a.RecordId == adminId && a.Action == "AUTH_LOGIN_LOCKOUT"));
    }

    [Fact]
    public async Task ActivationFailuresCountOnceAndCorrectCredentialsStayRestrictedUntilOtp()
    {
        var activation = AccountCredentials.NewCode();
        await using (var db = new QLCDDbContext(options))
        {
            var admin = await db.TaiKhoans.SingleAsync();
            AccountCredentials.IssueActivation(admin, activation, clock.GetUtcNow().UtcDateTime);
            await db.SaveChangesAsync();
        }
        var login = new LoginCommand(Username, AccountCredentials.InitialPassword) { ActivationCode = activation };
        Assert.Null((await Send(login with { Password = "WrongPassword1!", ActivationCode = "bad" })).Value);
        Assert.Null((await Send(login with { ActivationCode = null })).Value);
        Assert.Null((await Send(login with { ActivationCode = "bad" })).Value);
        var restricted = (await Send(login)).Value!;
        Assert.NotNull(restricted.SessionToken);
        Assert.True(restricted.Profile.NeedsAuthenticator);
        Assert.True(restricted.Profile.ActivationVerified);
        await using var check = new QLCDDbContext(options);
        Assert.Equal(3, (await check.LoginAttempts.SingleAsync()).FailedLoginAttempts);
        Assert.True((await check.AuthSessions.SingleAsync()).ActivationVerified);
        Assert.NotNull((await check.TaiKhoans.SingleAsync()).ActivationCodeHash);
    }

    [Fact]
    public async Task SuccessfulOtpBeforeTheThresholdResetsTheCounterAndUnknownNamesUseTheSameLockout()
    {
        for (var i = 0; i < 4; i++)
            Assert.Null((await Send(new(Username, "WrongPassword1!"))).LockoutEndUtc);
        var proof = (await Send(new(Username, Password))).Value!.Proof!;
        Assert.NotNull((await Send(new(Username, "", "123456") { VerifiedPassword = proof })).Value?.SessionToken);
        Assert.Null((await Send(new(Username, "WrongPassword1!"))).LockoutEndUtc);
        for (var i = 0; i < 4; i++)
            Assert.Null((await Send(new("unknown-fixture", "WrongPassword1!"))).LockoutEndUtc);
        clock.Advance(TimeSpan.FromDays(2));
        Assert.Equal(clock.GetUtcNow().UtcDateTime.AddMinutes(10),
            (await Send(new("unknown-fixture", "WrongPassword1!"))).LockoutEndUtc);
        await using var db = new QLCDDbContext(options);
        Assert.Equal(1, (await db.LoginAttempts.SingleAsync(row => row.Key == LoginAttemptGuard.AccountKey(adminId))).FailedLoginAttempts);
    }

    private async Task<LoginAttemptResult<LoginResult>> Send(LoginCommand request)
    {
        await using var db = new QLCDDbContext(options);
        return await new LoginCommandHandler(db, new FixtureMfa(), clock).Handle(request, default);
    }

    private sealed class ManualClock : TimeProvider
    {
        private DateTimeOffset now = new(2026, 11, 26, 0, 0, 0, TimeSpan.Zero);
        public override DateTimeOffset GetUtcNow() => now;
        public void Advance(TimeSpan span) => now += span;
    }

    private sealed class FixtureMfa : IMfaVerifier
    {
        public bool TryVerify(TaiKhoan account, string? code, out long? step)
        {
            step = 1;
            return code == "123456" && account.LastMfaStep is null;
        }
    }
}
