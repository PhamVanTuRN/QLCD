using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Application.Features.Accounts.Queries.GetAccounts;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Services;
using QLCD.Shared.Security;

namespace QLCD.Tests;

public sealed class OrganizationLifecycleTests : IAsyncLifetime
{
    private QLCDDbContext db = null!;
    private readonly User admin = new(Guid.NewGuid(), "ADMIN", null);
    private bool sql;
    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>();
        var connection = Environment.GetEnvironmentVariable("QLCD_TEST_ORG_SQL_CONNECTION");
        if (connection is null) options.UseInMemoryDatabase(Guid.NewGuid().ToString());
        else
        {
            var builder = new SqlConnectionStringBuilder(connection);
            if (!builder.InitialCatalog.StartsWith("QLCD_Test_", StringComparison.Ordinal)) throw new InvalidOperationException("An isolated test database is required.");
            builder.InitialCatalog = "QLCD_Test_Org_" + Guid.NewGuid().ToString("N");
            options.UseSqlServer(builder.ConnectionString);
            sql = true;
        }
        db = new QLCDDbContext(options.Options);
        if (sql)
        {
            Assert.False(db.Database.HasPendingModelChanges());
            await db.Database.MigrateAsync();
        }
    }
    public async Task DisposeAsync()
    {
        if (sql) await db.Database.EnsureDeletedAsync();
        await db.DisposeAsync();
    }

    [Fact]
    public async Task DeactivationPreservesDataAndLegacyToggleCannotBypassAuthenticatedUnlock()
    {
        var (root, unit, accounts) = await Seed();
        var member = new DoanVien { HoTen = "Synthetic member", SoCCCD = "000000000901", MaNhanVien = "ORG-001", MaToCongDoan = unit.Id };
        var activity = new HoatDongCongDoan { DonViId = unit.Id, TenHoatDong = "Synthetic activity", LoaiHoatDong = "FIXTURE", DiaDiem = "Fixture" };
        db.DoanViens.Add(member); db.HoatDongCongDoans.Add(activity);
        await db.SaveChangesAsync();
        var accountVersions = accounts.Select(a => a.SecurityVersion).ToArray();
        await Deactivate(unit.Id);
        Assert.Equal(0, unit.TrangThai); Assert.False(unit.IsDeleted); Assert.Equal(root.Id, unit.MaParent);
        for (var i = 0; i < accounts.Length; i++)
        {
            Assert.False(accounts[i].IsDeleted); Assert.NotEqual(accountVersions[i], accounts[i].SecurityVersion);
        }
        Assert.True(accounts[0].TrangThai); Assert.False(accounts[1].TrangThai);
        var rows = await ListAccounts();
        Assert.All(rows, a => { Assert.False(a.OrganizationActive); Assert.False(a.CanSignIn); Assert.Equal(unit.Id, a.OrganizationId); });
        Assert.Equal(2, rows.Count);
        Assert.Equal(unit.Id, (await db.DoanViens.SingleAsync()).MaToCongDoan);
        Assert.Equal(unit.Id, (await db.HoatDongCongDoans.SingleAsync()).DonViId);
        var tree = await Tree(); Assert.DoesNotContain(tree!.Children, u => u.Id == unit.Id);
        var inactive = await new GetInactiveUnitsQueryHandler(db, admin).Handle(new(), default);
        Assert.Equal(unit.Id, Assert.Single(inactive).Id);
        await Assert.ThrowsAsync<OrganizationStateException>(() => Toggle(accounts[1].Id));
        Assert.False(accounts[1].TrangThai); Assert.Equal(0, unit.TrangThai);
        Assert.DoesNotContain((await Tree())!.Children, u => u.Id == unit.Id);
        Assert.All(await ListAccounts(), a => Assert.False(a.CanSignIn));
        await Toggle(accounts[0].Id); // Explicitly lock one account; organization restoration must not unlock it.
        await Restore(unit.Id);
        Assert.Equal(1, unit.TrangThai); Assert.False(accounts[0].TrangThai); Assert.False(accounts[1].TrangThai);
        Assert.Contains((await Tree())!.Children, u => u.Id == unit.Id);
        Assert.Equal(2, await db.DonViCongDoans.IgnoreQueryFilters().CountAsync());
        Assert.Single(db.DoanViens); Assert.Single(db.HoatDongCongDoans);
    }

    [Theory]
    [InlineData(false, false)]
    [InlineData(true, false)]
    [InlineData(true, true)]
    public async Task ChildrenIncludingInactiveOrLegacyDeletedBlockDeactivationWithoutCascade(bool inactive, bool legacy)
    {
        var (_, unit, accounts) = await Seed();
        var child = new DonViCongDoan { TenDonVi = "Child", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP, MaParent = unit.Id, Level = 3, TrangThai = inactive ? 0 : 1, IsDeleted = legacy };
        db.DonViCongDoans.Add(child); await db.SaveChangesAsync();
        var stamp = accounts[0].SecurityVersion;
        await Assert.ThrowsAsync<OrganizationStateException>(() => Deactivate(unit.Id));
        Assert.Equal(1, unit.TrangThai); Assert.False(unit.IsDeleted); Assert.Equal(stamp, accounts[0].SecurityVersion);
        Assert.Equal(inactive ? 0 : 1, child.TrangThai); Assert.Equal(legacy, child.IsDeleted);
    }

    [Fact]
    public async Task LegacyDeletedUnitAndAccountsRemainVisibleAndRequireIndependentRecovery()
    {
        var (_, unit, accounts) = await Seed();
        unit.IsDeleted = true; unit.TrangThai = 0;
        foreach (var account in accounts) { account.IsDeleted = true; account.TrangThai = false; }
        await db.SaveChangesAsync();
        Assert.All(await ListAccounts(), a => { Assert.True(a.AccountArchived); Assert.False(a.CanSignIn); Assert.Equal(unit.TenDonVi, a.DonViTen); });
        var row = Assert.Single(await new GetInactiveUnitsQueryHandler(db, admin).Handle(new(), default));
        Assert.True(row.LegacyDeleted); Assert.True(row.CanRestore);
        await Restore(unit.Id);
        Assert.All(await ListAccounts(), a => { Assert.True(a.AccountArchived); Assert.True(a.OrganizationActive); Assert.False(a.CanSignIn); });
        await Assert.ThrowsAsync<OrganizationStateException>(() => Toggle(accounts[0].Id));
        Assert.True(accounts[0].IsDeleted); Assert.False(accounts[0].TrangThai);
        Assert.All(await ListAccounts(), a => Assert.False(a.CanSignIn));
        Assert.True(accounts[1].IsDeleted); Assert.Equal(1, unit.TrangThai);
    }

    [Fact]
    public async Task InactiveParentBlocksChildLoginAndScopeAndRestorationDoesNotReviveOldSessions()
    {
        var (_, parent, accounts) = await Seed();
        var child = new DonViCongDoan { TenDonVi = "Legacy child", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP, MaParent = parent.Id, Level = 3 };
        var account = Account(child.Id, true); account.VaiTro = "TOCD";
        db.DonViCongDoans.Add(child); db.TaiKhoans.Add(account);
        parent.TrangThai = 0; await db.SaveChangesAsync();
        var childUser = new User(account.Id, "TOCD", child.Id);
        var scope = new OrganizationScopeService(childUser, db);
        Assert.Empty((await scope.GetAllowedOrganizationIdsAsync())!); Assert.False(await scope.IsInScopeAsync(child.Id));
        var login = new LoginCommandHandler(db, new Mfa(), TimeProvider.System);
        Assert.Null(await login.Handle(new LoginCommand(account.Username, "FixturePassword1!"), default));
        Assert.False((await ListAccounts()).Single(a => a.Id == account.Id).CanSignIn);
        await Assert.ThrowsAsync<OrganizationStateException>(() => Restore(child.Id));
        await Assert.ThrowsAsync<ArgumentException>(() => new CreateUnionUnitCommandHandler(db).Handle(new CreateUnionUnitCommand { TenDonVi = "Rejected", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP, MaParent = parent.Id }, default));
        var version = LoginCommandHandler.SessionVersion(account);
        await Restore(parent.Id);
        Assert.NotEqual(version, LoginCommandHandler.SessionVersion(account));
        Assert.Equal(1, child.TrangThai); Assert.Equal(parent.Id, child.MaParent); Assert.True(account.TrangThai);
        Assert.All(accounts, a => Assert.False(a.IsDeleted));
    }

    [Fact]
    public async Task StateCannotBeChangedThroughMetadataAndUnauthorizedOrRootChangesAreRejected()
    {
        var (root, unit, accounts) = await Seed();
        await Assert.ThrowsAsync<OrganizationStateException>(() => new UpdateUnionUnitCommandHandler(db, admin).Handle(new UpdateUnionUnitCommand { Id = unit.Id, TenDonVi = unit.TenDonVi, TrangThai = 0 }, default));
        await Assert.ThrowsAsync<OrganizationStateException>(() => Deactivate(root.Id));
        var other = new User(Guid.NewGuid(), "CDBP", unit.Id);
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => new DeleteUnionUnitCommandHandler(db, other).Handle(new(unit.Id), default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => new RestoreUnionUnitCommandHandler(db, other).Handle(new(unit.Id), default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => new GetInactiveUnitsQueryHandler(db, other).Handle(new(), default));
        Assert.Equal(1, unit.TrangThai); Assert.True(accounts[0].TrangThai);
    }

    [Theory]
    [InlineData("ADMIN")]
    [InlineData("CDCS")]
    public async Task PrivilegedRolesLinkedToAnInactiveUnitDoNotBypassTheOrganizationBlock(string role)
    {
        var (_, unit, accounts) = await Seed();
        unit.TrangThai = 0; accounts[0].VaiTro = role; await db.SaveChangesAsync();
        var actor = new User(accounts[0].Id, role, unit.Id);
        var scope = new OrganizationScopeService(actor, db);
        Assert.Empty((await scope.GetAllowedOrganizationIdsAsync())!);
        Assert.False(await scope.IsInScopeAsync(unit.Id));
        var account = await db.TaiKhoans.Include(a => a.Organization).SingleAsync(a => a.Id == accounts[0].Id);
        Assert.False(LoginCommandHandler.IsUsable(account));
    }

    [Fact]
    public async Task RepeatedRequestsAreIdempotentAndDoNotAffectUnrelatedUnitsOrAccounts()
    {
        var (root, unit, _) = await Seed();
        var sibling = new DonViCongDoan { TenDonVi = "Sibling", MaParent = root.Id, LoaiToChuc = LoaiToChuc.CDBP, Level = 2 };
        var unrelated = Account(sibling.Id, true); db.DonViCongDoans.Add(sibling); db.TaiKhoans.Add(unrelated); await db.SaveChangesAsync();
        var stamp = unrelated.SecurityVersion;
        await Deactivate(unit.Id); await Deactivate(unit.Id); await Restore(unit.Id); await Restore(unit.Id);
        Assert.Equal(stamp, unrelated.SecurityVersion); Assert.True(unrelated.TrangThai); Assert.Equal(1, sibling.TrangThai);
        Assert.Equal(2, await db.AuditLogs.CountAsync(a => a.RecordId == unit.Id));
    }

    private async Task<(DonViCongDoan, DonViCongDoan, TaiKhoan[])> Seed()
    {
        var root = new DonViCongDoan { TenDonVi = "Synthetic root", LoaiToChuc = LoaiToChuc.CDCS, Level = 1 };
        var unit = new DonViCongDoan { TenDonVi = "Synthetic department", LoaiToChuc = LoaiToChuc.CDBP, Level = 2, MaParent = root.Id };
        var accounts = new[] { Account(unit.Id, true), Account(unit.Id, false) };
        db.DonViCongDoans.AddRange(root, unit); db.TaiKhoans.AddRange(accounts); await db.SaveChangesAsync();
        return (root, unit, accounts);
    }
    private static TaiKhoan Account(Guid unit, bool active) => new() { Username = "fixture_" + Guid.NewGuid().ToString("N"), HoTen = "Synthetic", VaiTro = "CDBP", OrganizationId = unit, TrangThai = active, PasswordHash = PasswordHasher.Hash("FixturePassword1!") };
    private Task<bool> Deactivate(Guid id) => new DeleteUnionUnitCommandHandler(db, admin).Handle(new(id), default);
    private Task<bool> Restore(Guid id) => new RestoreUnionUnitCommandHandler(db, admin).Handle(new(id), default);
    private Task Toggle(Guid id) => new AccountCommands(db, admin, TimeProvider.System, new Mfa(), new CredentialResetPermission(admin.Id)).Handle(new ToggleAccount(id), default);
    private Task<List<AccountDto>> ListAccounts() => new GetAccountsQueryHandler(db).Handle(new(), default);
    private Task<UnionUnitDto?> Tree() => new GetUnionUnitsTreeQueryHandler(db, admin, new OrganizationScopeService(admin, db)).Handle(new(), default);
    private sealed class Mfa : IMfaVerifier { public bool TryVerify(TaiKhoan account, string? code, out long? step) { step = null; return false; } }
    private sealed record User(Guid Id, string Role, Guid? OrganizationId) : ICurrentUserService
    {
        public Guid? UserId => Id; public string Username => "qlcd_admin";
        public bool IsAdmin => Role == "ADMIN"; public bool IsCdcs => Role == "CDCS"; public bool IsCdbp => Role == "CDBP"; public bool IsTocd => Role == "TOCD";
    }
}
