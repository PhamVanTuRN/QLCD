using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using QLCD.Shared.Security;

namespace QLCD.Tests;

public sealed class AuthenticatedUnlockTests : IAsyncLifetime
{
    private QLCDDbContext db = null!;
    private bool sql;
    private readonly FailSecondSave failSave = new();
    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>().AddInterceptors(failSave);
        var connection = Environment.GetEnvironmentVariable("QLCD_TEST_UNLOCK_SQL_CONNECTION");
        if (connection is null) options.UseInMemoryDatabase(Guid.NewGuid().ToString());
        else
        {
            var builder = new SqlConnectionStringBuilder(connection);
            if (!builder.InitialCatalog.StartsWith("QLCD_Test_", StringComparison.Ordinal)) throw new InvalidOperationException("An isolated test database is required.");
            builder.InitialCatalog = "QLCD_Test_Unlock_" + Guid.NewGuid().ToString("N");
            options.UseSqlServer(builder.ConnectionString); sql = true;
        }
        db = new QLCDDbContext(options.Options);
        if (sql) { Assert.False(db.Database.HasPendingModelChanges()); await db.Database.MigrateAsync(); }
    }
    public async Task DisposeAsync() { if (sql) await db.Database.EnsureDeletedAsync(); await db.DisposeAsync(); }

    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task VerifiedUnlockRestoresSameUnitAndOnlyTheSelectedAccountIncludingLegacyRows(bool legacy)
    {
        var (actor, target, unit, block, other) = await Seed(legacy);
        var parent = unit.MaParent; var oldVersion = target.SecurityVersion;
        var oldPassword = target.PasswordHash; var otherFlags = other.Select(a => (a.TrangThai, a.IsDeleted)).ToArray();
        var result = await Handler(actor).Handle(Request(actor, target), default);
        Assert.True(result.AccountActive); Assert.True(result.OrganizationRestored); Assert.Equal(unit.Id, result.OrganizationId);
        Assert.True(target.TrangThai); Assert.False(target.IsDeleted); Assert.NotEqual(oldVersion, target.SecurityVersion);
        Assert.Equal(1, unit.TrangThai); Assert.False(unit.IsDeleted); Assert.Equal(parent, unit.MaParent); Assert.Equal(block.Id, unit.MaKhoi);
        Assert.Equal(oldPassword, target.PasswordHash); Assert.Equal("protected-target", target.ProtectedMfaSecret);
        Assert.Equal("recovery-target", target.RecoveryCodeHashes); Assert.False(block.TrangThai);
        for (var i = 0; i < other.Length; i++) Assert.Equal(otherFlags[i], (other[i].TrangThai, other[i].IsDeleted));
        Assert.Equal(42L, actor.LastMfaStep);
        Assert.Equal(2, await db.DonViCongDoans.IgnoreQueryFilters().CountAsync());
        Assert.Equal(unit.Id, (await db.DoanViens.SingleAsync()).MaToCongDoan);
        Assert.Single(db.AuditLogs, a => a.Action == "ORG_RESTORE" && a.RecordId == unit.Id);
        Assert.Single(db.AuditLogs, a => a.Action == "AUTH_ACCOUNT_UNLOCK" && a.RecordId == target.Id);
        Assert.True(await db.DonViCongDoans.OperationalUnits().AnyAsync(u => u.Id == unit.Id));
    }

    [Theory]
    [InlineData("WrongPassword1!", "123456", false)]
    [InlineData("AdminPassword1!", "000000", false)]
    [InlineData("AdminPassword1!", "123456", true)]
    public async Task InvalidReauthenticationCannotRestoreOrUnlock(string password, string code, bool stale)
    {
        var (actor, target, unit, _, _) = await Seed();
        var request = Request(actor, target) with { CurrentPassword = password, Code = code };
        if (stale) request = request with { SessionVersion = Guid.NewGuid() };
        var version = target.SecurityVersion;
        await Assert.ThrowsAsync<AdminUnlockAuthenticationException>(() => Handler(actor).Handle(request, default));
        Assert.Equal(0, unit.TrangThai); Assert.False(target.TrangThai); Assert.Equal(version, target.SecurityVersion);
        Assert.Null(actor.LastMfaStep); Assert.Empty(db.AuditLogs);
    }

    [Fact]
    public async Task InactiveParentRequiresSeparateRecoveryAndDoesNotConsumeOtpOrChangeAnyState()
    {
        var (actor, target, unit, _, _) = await Seed();
        var parent = await db.DonViCongDoans.SingleAsync(u => u.Id == unit.MaParent); parent.TrangThai = 0; await db.SaveChangesAsync();
        await Assert.ThrowsAsync<OrganizationStateException>(() => Handler(actor).Handle(Request(actor, target), default));
        Assert.Equal(0, parent.TrangThai); Assert.Equal(0, unit.TrangThai); Assert.False(target.TrangThai);
        Assert.Null(actor.LastMfaStep); Assert.Empty(db.AuditLogs);
    }

    [Fact]
    public async Task OldToggleAndActivationCannotBypassVerifiedRecovery()
    {
        var (actor, target, unit, _, _) = await Seed();
        var handler = Handler(actor);
        await Assert.ThrowsAsync<OrganizationStateException>(() => handler.Handle(new ToggleAccount(target.Id), default));
        await Assert.ThrowsAsync<OrganizationStateException>(() => handler.Handle(new IssueAccountActivation(target.Id, true, "fixture"), default));
        Assert.False(target.TrangThai); Assert.Equal(0, unit.TrangThai); Assert.Null(actor.LastMfaStep);
    }

    [Fact]
    public async Task SelfAndAdministratorTargetsAreRejectedAndDatabaseRoleIsRechecked()
    {
        var (actor, target, unit, _, _) = await Seed();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => Handler(actor).Handle(Request(actor, actor), default));
        target.VaiTro = "ADMIN"; await db.SaveChangesAsync();
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => Handler(actor).Handle(Request(actor, target), default));
        target.VaiTro = "CDBP"; actor.VaiTro = "CDCS"; await db.SaveChangesAsync();
        await Assert.ThrowsAsync<AdminUnlockAuthenticationException>(() => Handler(actor).Handle(Request(actor, target), default));
        Assert.False(target.TrangThai); Assert.Equal(0, unit.TrangThai);
    }

    [Fact]
    public async Task ActiveUnitRemainsUntouchedAndOtpReplayIsRejected()
    {
        var (actor, target, unit, _, other) = await Seed(); unit.TrangThai = 1; await db.SaveChangesAsync();
        var otherVersion = other[0].SecurityVersion;
        var request = Request(actor, target); var handler = Handler(actor);
        var result = await handler.Handle(request, default);
        Assert.False(result.OrganizationRestored); Assert.Equal(1, unit.TrangThai); Assert.True(target.TrangThai);
        Assert.Equal(otherVersion, other[0].SecurityVersion);
        Assert.DoesNotContain(db.AuditLogs, a => a.Action == "ORG_RESTORE");
        var stamp = target.SecurityVersion;
        await Assert.ThrowsAsync<AdminUnlockAuthenticationException>(() => handler.Handle(request, default));
        Assert.Equal(stamp, target.SecurityVersion); Assert.Single(db.AuditLogs);
    }

    [SqlUnlockFact]
    public async Task FailureAfterUnitRestoreRollsBackOrganizationAccountAndOtpTogetherOnSqlServer()
    {
        var (actor, target, unit, _, _) = await Seed();
        var actorId = actor.Id; var targetId = target.Id; var unitId = unit.Id; var stamp = target.SecurityVersion;
        failSave.Enabled = true;
        await Assert.ThrowsAsync<InvalidOperationException>(() => Handler(actor).Handle(Request(actor, target), default));
        failSave.Enabled = false; db.ChangeTracker.Clear();
        Assert.Equal(0, (await db.DonViCongDoans.SingleAsync(u => u.Id == unitId)).TrangThai);
        var saved = await db.TaiKhoans.SingleAsync(a => a.Id == targetId);
        Assert.False(saved.TrangThai); Assert.Equal(stamp, saved.SecurityVersion);
        Assert.Null((await db.TaiKhoans.SingleAsync(a => a.Id == actorId)).LastMfaStep);
        Assert.Empty(db.AuditLogs);
    }

    private async Task<(TaiKhoan, TaiKhoan, DonViCongDoan, KhoiChuyenMon, TaiKhoan[])> Seed(bool legacy = false)
    {
        var block = new KhoiChuyenMon { TenKhoi = "Stopped classification", TrangThai = false };
        var root = new DonViCongDoan { TenDonVi = "Synthetic root", LoaiToChuc = LoaiToChuc.CDCS, Level = 1 };
        var unit = new DonViCongDoan { TenDonVi = "Synthetic unit", LoaiToChuc = LoaiToChuc.CDBP, Level = 2, MaParent = root.Id, MaKhoi = block.Id, TrangThai = 0, IsDeleted = legacy };
        var actor = new TaiKhoan { Username = "another_admin", HoTen = "Synthetic admin", VaiTro = "ADMIN", PasswordHash = PasswordHasher.Hash("AdminPassword1!"), ProtectedMfaSecret = "protected-admin" };
        var target = new TaiKhoan { Username = "fixture_target", HoTen = "Synthetic target", VaiTro = "CDBP", OrganizationId = unit.Id, TrangThai = false, IsDeleted = legacy,
            PasswordHash = PasswordHasher.Hash("TargetPassword1!"), ProtectedMfaSecret = "protected-target", RecoveryCodeHashes = "recovery-target" };
        var other = new[] { new TaiKhoan { Username = "fixture_locked", HoTen = "Locked", VaiTro = "CDBP", OrganizationId = unit.Id, TrangThai = false, IsDeleted = legacy, PasswordHash = "unchanged" },
            new TaiKhoan { Username = "fixture_open", HoTen = "Open", VaiTro = "CDBP", OrganizationId = unit.Id, TrangThai = true, IsDeleted = legacy, PasswordHash = "unchanged" } };
        db.KhoiChuyenMons.Add(block); db.DonViCongDoans.AddRange(root, unit); db.TaiKhoans.AddRange(actor, target); db.TaiKhoans.AddRange(other);
        db.DoanViens.Add(new DoanVien { HoTen = "Synthetic member", SoCCCD = "000000009321", MaNhanVien = "UNLOCK-001", MaToCongDoan = unit.Id });
        await db.SaveChangesAsync(); return (actor, target, unit, block, other);
    }
    private AccountCommands Handler(TaiKhoan actor) => new(db, new User(actor.Id), TimeProvider.System, new Mfa(), new CredentialResetPermission(Guid.NewGuid()));
    private static UnlockAccount Request(TaiKhoan actor, TaiKhoan target) => new(target.Id, "AdminPassword1!", "123456", LoginCommandHandler.SessionVersion(actor), "fixture-trace");
    private sealed record User(Guid Id) : ICurrentUserService
    {
        public Guid? UserId => Id; public string Username => "another_admin"; public string Role => "ADMIN"; public Guid? OrganizationId => null;
        public bool IsAdmin => true; public bool IsCdcs => false; public bool IsCdbp => false; public bool IsTocd => false;
    }
    private sealed class Mfa : IMfaVerifier
    {
        public bool TryVerify(TaiKhoan account, string? code, out long? step) { step = 42; return code == "123456" && (account.LastMfaStep is null || account.LastMfaStep < 42); }
    }
    private sealed class FailSecondSave : SaveChangesInterceptor
    {
        public bool Enabled { get; set; } private int count;
        public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData, InterceptionResult<int> result, CancellationToken cancellationToken = default)
        {
            if (Enabled && ++count == 2) throw new InvalidOperationException("Synthetic final save failure");
            return ValueTask.FromResult(result);
        }
    }
}
public sealed class SqlUnlockFactAttribute : FactAttribute
{
    public SqlUnlockFactAttribute() { if (Environment.GetEnvironmentVariable("QLCD_TEST_UNLOCK_SQL_CONNECTION") is null) Skip = "Requires an isolated SQL Server unlock fixture."; }
}
