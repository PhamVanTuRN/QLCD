using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using QLCD.Shared.Security;

namespace QLCD.Tests;

public sealed class AccountLifecycleTests
{
    [Theory]
    [InlineData(LoaiToChuc.CDCS, "CDCS")]
    [InlineData(LoaiToChuc.CDBP, "CDBP")]
    [InlineData(LoaiToChuc.TO_CD_TRUC_THUOC_CDCS, "TOCD")]
    [InlineData(LoaiToChuc.TO_CD_THUOC_CDBP, "TOCD")]
    public async Task CreationPreservesEnteredNameAndCreatesLockedAccountWithCommonPassword(LoaiToChuc type, string role)
    {
        await using var db = Database();
        DonViCongDoan? parent = null;
        if (type != LoaiToChuc.CDCS)
        {
            parent = new DonViCongDoan { TenDonVi = "Existing parent", LoaiToChuc = type == LoaiToChuc.TO_CD_THUOC_CDBP ? LoaiToChuc.CDBP : LoaiToChuc.CDCS };
            db.DonViCongDoans.Add(parent);
        }
        var existing = new TaiKhoan { Username = "cdbp_existing", HoTen = "Existing", VaiTro = "CDBP", PasswordHash = "existing-hash" };
        db.TaiKhoans.Add(existing);
        await db.SaveChangesAsync();
        var block = new KhoiChuyenMon { TenKhoi = "Fixture block" }; db.KhoiChuyenMons.Add(block); await db.SaveChangesAsync();
        const string entered = "  Khoa Nội - A  ";
        var id = await new CreateUnionUnitCommandHandler(db).Handle(new CreateUnionUnitCommand
        { TenDonVi = entered, LoaiToChuc = type, MaParent = parent?.Id, MaKhoi = block.Id }, default);
        Assert.Equal(entered, (await db.DonViCongDoans.SingleAsync(u => u.Id == id)).TenDonVi);
        var account = await db.TaiKhoans.SingleAsync(a => a.OrganizationId == id);
        Assert.Equal((role == "TOCD" ? "tcd" : role.ToLowerInvariant()) + "_khoa_noi_a", account.Username);
        Assert.Equal(role, account.VaiTro);
        Assert.True(PasswordHasher.Verify(AccountCredentials.InitialPassword, account.PasswordHash));
        Assert.True(account.MustChangePassword);
        Assert.False(account.TrangThai);
        Assert.Null(account.TemporaryPasswordExpiresUtc); // The 24-hour window starts when admin activates it.
        Assert.Null(account.ProtectedMfaSecret);
        Assert.Equal("cdbp_existing", existing.Username);
        Assert.Equal("existing-hash", existing.PasswordHash);
        if (parent is not null) Assert.Equal("Existing parent", parent.TenDonVi);
    }

    [Fact]
    public async Task GeneratedLoginsUseAbbreviatedTypeOnceAndReserveExistingNames()
    {
        await using var db = Database();
        var root = new DonViCongDoan { TenDonVi = "Existing root", LoaiToChuc = LoaiToChuc.CDCS };
        db.DonViCongDoans.Add(root);
        db.TaiKhoans.Add(new TaiKhoan { Username = "cdbp_khoa_noi", HoTen = "Existing login", VaiTro = "ADMIN", PasswordHash = "unchanged" });
        await db.SaveChangesAsync();
        var block = new KhoiChuyenMon { TenKhoi = "Fixture block" }; db.KhoiChuyenMons.Add(block); await db.SaveChangesAsync();
        var handler = new CreateUnionUnitCommandHandler(db);
        foreach (var (name, expected) in new[] {
            ("Khoa Nội", "cdbp_khoa_noi_1"), ("Khoa Nội", "cdbp_khoa_noi_2"),
            ("CDBP Khoa Nội", "cdbp_khoa_noi_3"), ("TCD Khoa Nhi", "cdbp_tcd_khoa_nhi"),
            ("Công đoàn cơ sở Khoa Nội", "cdbp_cong_doan_co_so_khoa_noi"), ("!!!", "cdbp_don_vi") })
        {
            var id = await handler.Handle(new CreateUnionUnitCommand { TenDonVi = name, LoaiToChuc = LoaiToChuc.CDBP, MaParent = root.Id, MaKhoi = block.Id }, default);
            Assert.Equal(name, (await db.DonViCongDoans.SingleAsync(u => u.Id == id)).TenDonVi);
            Assert.Equal(expected, (await db.TaiKhoans.SingleAsync(a => a.OrganizationId == id)).Username);
        }
        var hashes = await db.TaiKhoans.Where(a => a.OrganizationId != null).Select(a => a.PasswordHash).ToListAsync();
        Assert.Equal(hashes.Count, hashes.Distinct().Count());
    }

    [Theory]
    [InlineData(LoaiToChuc.TO_CD_TRUC_THUOC_CDCS, "Tổ Công đoàn Khoa Nhi", "tcd_khoa_nhi")]
    [InlineData(LoaiToChuc.TO_CD_TRUC_THUOC_CDCS, "TCĐ Khoa Nhi", "tcd_khoa_nhi")]
    [InlineData(LoaiToChuc.CDBP, "Công đoàn bộ phận Liên Cơ Quan", "cdbp_lien_co_quan")]
    [InlineData(LoaiToChuc.CDCS, "Công đoàn cơ sở 108", "cdcs_108")]
    public async Task LeadingTypeNamesAreAbbreviatedOnlyInNewUsernames(LoaiToChuc type, string name, string expected)
    {
        await using var db = Database();
        var block = new KhoiChuyenMon { TenKhoi = "Fixture" }; db.KhoiChuyenMons.Add(block);
        DonViCongDoan? parent = null;
        if (type != LoaiToChuc.CDCS) { parent = new DonViCongDoan { TenDonVi = "Root", LoaiToChuc = LoaiToChuc.CDCS }; db.DonViCongDoans.Add(parent); }
        var reserved = new TaiKhoan { Username = expected, HoTen = "Legacy account", VaiTro = "CDBP", PasswordHash = "preserved", IsDeleted = true };
        db.TaiKhoans.Add(reserved); await db.SaveChangesAsync();
        var id = await new CreateUnionUnitCommandHandler(db).Handle(new() { TenDonVi = name, LoaiToChuc = type, MaParent = parent?.Id, MaKhoi = block.Id }, default);
        Assert.Equal(name, (await db.DonViCongDoans.SingleAsync(u => u.Id == id)).TenDonVi);
        Assert.Equal(expected + "_1", (await db.TaiKhoans.SingleAsync(a => a.OrganizationId == id)).Username);
        Assert.Equal(expected, reserved.Username); Assert.True(reserved.IsDeleted); Assert.Equal("preserved", reserved.PasswordHash);
    }

    [Theory]
    [InlineData("ADMIN", true)]
    [InlineData("ADMIN", false)]
    [InlineData("CDCS", true)]
    [InlineData("CDCS", false)]
    [InlineData("CDBP", true)]
    [InlineData("CDBP", false)]
    [InlineData("TOCD", true)]
    [InlineData("TOCD", false)]
    public async Task PasswordResetUsesSamePasswordForEveryRoleAndPreservesMfaAndLock(string role, bool active)
    {
        await using var db = Database();
        var actor = Admin();
        var target = new TaiKhoan { Username = "target", HoTen = "Target", VaiTro = role,
            PasswordHash = PasswordHasher.Hash("PreviousPassword1!"), TrangThai = active,
            ProtectedMfaSecret = "mfa-kept", RecoveryCodeHashes = "recovery-kept", LastMfaStep = 17 };
        db.TaiKhoans.AddRange(actor, target);
        await db.SaveChangesAsync();
        var version = LoginCommandHandler.SessionVersion(target);
        var handler = Commands(db, actor);
        await handler.Handle(new ResetAccountPassword(target.Id, "AdminPassword1!", "123456", LoginCommandHandler.SessionVersion(actor), "fixture"), default);
        Assert.True(PasswordHasher.Verify(AccountCredentials.InitialPassword, target.PasswordHash));
        Assert.False(PasswordHasher.Verify("PreviousPassword1!", target.PasswordHash));
        Assert.True(target.MustChangePassword);
        Assert.InRange(target.TemporaryPasswordExpiresUtc!.Value, DateTime.UtcNow.AddHours(23), DateTime.UtcNow.AddHours(25));
        Assert.Equal(active, target.TrangThai);
        Assert.Equal("mfa-kept", target.ProtectedMfaSecret);
        Assert.Equal("recovery-kept", target.RecoveryCodeHashes);
        Assert.Equal(17L, target.LastMfaStep);
        Assert.NotEqual(version, LoginCommandHandler.SessionVersion(target));
        Assert.Single(db.AuditLogs, a => a.RecordId == target.Id && a.Action == "AUTH_PASSWORD_RESET");
        var hash = target.PasswordHash;
        var deadline = target.TemporaryPasswordExpiresUtc;
        await handler.Handle(new ResetAccountAuthenticator(target.Id, "AdminPassword1!", "123456", LoginCommandHandler.SessionVersion(actor), "fixture"), default);
        Assert.Equal(hash, target.PasswordHash);
        Assert.Equal(deadline, target.TemporaryPasswordExpiresUtc);
        Assert.Equal(active, target.TrangThai);
        Assert.Null(target.ProtectedMfaSecret);
        Assert.Null(target.RecoveryCodeHashes);
    }

    [Fact]
    public async Task IssuingActivationStartsNewAccountDeadlineButPreservesLegacyPassword()
    {
        await using var db = Database();
        var actor = Admin();
        var unit = new DonViCongDoan { TenDonVi = "Fixture unit", LoaiToChuc = LoaiToChuc.CDBP, TrangThai = 1 };
        db.DonViCongDoans.Add(unit);
        var target = new TaiKhoan { Username = "new", HoTen = "New", VaiTro = "CDBP", OrganizationId = unit.Id,
            PasswordHash = PasswordHasher.Hash(AccountCredentials.InitialPassword), MustChangePassword = true, TrangThai = false };
        var legacy = new TaiKhoan { Username = "legacy", HoTen = "Legacy", VaiTro = "CDBP", OrganizationId = unit.Id,
            PasswordHash = PasswordHasher.Hash("LegacyPassword1!"), TrangThai = true };
        db.TaiKhoans.AddRange(actor, target, legacy);
        await db.SaveChangesAsync();
        var handler = Commands(db, actor);
        var login = new LoginCommandHandler(db, new FixtureMfa(), TimeProvider.System);
        Assert.Null(await login.Handle(new LoginCommand(target.Username, AccountCredentials.InitialPassword), default));
        var legacyHash = legacy.PasswordHash;
        foreach (var account in new[] { target, legacy })
            await handler.Handle(new IssueAccountActivation(account.Id, true, "fixture"), default);
        Assert.True(target.TrangThai);
        Assert.NotNull(target.TemporaryPasswordExpiresUtc);
        var session = await login.Handle(new LoginCommand(target.Username, AccountCredentials.InitialPassword), default);
        Assert.NotNull(session);
        Assert.True(session.Profile.MustChangePassword);
        Assert.True(session.Profile.NeedsAuthenticator);
        Assert.Null(session.Profile.OrganizationId);
        target.TemporaryPasswordExpiresUtc = DateTime.UtcNow.AddMinutes(-1);
        await db.SaveChangesAsync();
        Assert.Null(await login.Handle(new LoginCommand(target.Username, AccountCredentials.InitialPassword), default));
        Assert.Equal(legacyHash, legacy.PasswordHash);
        Assert.False(legacy.MustChangePassword);
        Assert.Null(legacy.TemporaryPasswordExpiresUtc);
    }

    private static QLCDDbContext Database() => new(new DbContextOptionsBuilder<QLCDDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static TaiKhoan Admin() => new() { Username = "qlcd_admin", HoTen = "Fixture admin", VaiTro = "ADMIN", PasswordHash = PasswordHasher.Hash("AdminPassword1!"), ProtectedMfaSecret = "fixture" };
    private static AccountCommands Commands(QLCDDbContext db, TaiKhoan actor) => new(db, new FixtureUser(actor.Id), TimeProvider.System, new FixtureMfa(), new CredentialResetPermission(actor.Id));
    private sealed class FixtureMfa : IMfaVerifier
    {
        public bool TryVerify(TaiKhoan account, string? code, out long? step) { step = 42; return code == "123456"; }
    }
    private sealed record FixtureUser(Guid Id) : ICurrentUserService
    {
        public Guid? UserId => Id;
        public string Username => "qlcd_admin";
        public string Role => "ADMIN";
        public Guid? OrganizationId => null;
        public bool IsAdmin => true;
        public bool IsCdcs => false;
        public bool IsCdbp => false;
        public bool IsTocd => false;
    }
}
