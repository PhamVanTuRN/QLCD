using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Domain.Entities;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Services;
using QLCD.Shared.Security;

namespace QLCD.Tests;

public sealed class SecurityTests
{
    [Fact]
    public void ActivationPreservesLegacyPasswordAndRecoveryCodesAreStoredOnlyAsHashes()
    {
        var account = new TaiKhoan { Username = "fixture", HoTen = "Fixture", VaiTro = "ADMIN", PasswordHash = "unchanged" };
        var now = new DateTime(2026, 11, 25, 0, 0, 0, DateTimeKind.Utc);
        var activation = AccountCredentials.NewCode();
        var previousStamp = account.SecurityVersion;
        AccountCredentials.IssueEnrollment(account, activation, now);
        Assert.Equal("unchanged", account.PasswordHash);
        Assert.NotEqual(previousStamp, account.SecurityVersion);
        Assert.Equal(now.AddHours(24), account.ActivationCodeExpiresUtc);
        Assert.Null(account.TemporaryPasswordExpiresUtc);
        Assert.NotEqual(activation, account.ActivationCodeHash);
        Assert.True(AccountCredentials.MatchesHash(activation.ToLowerInvariant(), account.ActivationCodeHash));

        var codes = AccountCredentials.RotateRecoveryCodes(account);
        Assert.Equal(10, codes.Distinct().Count());
        Assert.All(codes, code =>
        {
            Assert.True(AccountCredentials.MatchesRecoveryCode(account, code));
            Assert.DoesNotContain(code, account.RecoveryCodeHashes!);
        });
        AccountCredentials.IssueActivation(account, AccountCredentials.NewCode(), now);
        Assert.True(account.MustChangePassword);
        Assert.False(PasswordHasher.IsAcceptable(AccountCredentials.InitialPassword));
        Assert.True(PasswordHasher.Verify(AccountCredentials.InitialPassword, account.PasswordHash));
        Assert.All(codes, code => Assert.False(AccountCredentials.MatchesRecoveryCode(account, code)));
    }

    [Theory]
    [InlineData("Abcdef1!", true)]
    [InlineData("Đoànviên١!", true)]
    [InlineData("Abcde1!", false)]
    [InlineData("Abcdef12", false)]
    [InlineData("Abcdef1 ", false)]
    [InlineData("abcdef1!", false)]
    [InlineData("ABCDEF1!", false)]
    [InlineData("Abcdefg!", false)]
    [InlineData("123456aA@", false)]
    public void PasswordPolicyEnforcesAllConditions(string candidate, bool accepted) =>
        Assert.Equal(accepted, PasswordHasher.IsAcceptable(candidate));

    [Fact]
    public void CredentialResetNeedsTheConfiguredIdAndDesignatedAdministrator()
    {
        var id = Guid.NewGuid();
        var permission = new CredentialResetPermission(id);
        Assert.True(permission.Allows(id, "ADMIN"));
        Assert.False(permission.Allows(Guid.NewGuid(), "ADMIN"));
        Assert.False(permission.Allows(null, "ADMIN"));
        Assert.False(permission.Allows(id, "CDCS"));
        Assert.False(new CredentialResetPermission(null).Allows(id, "ADMIN"));
        Assert.False(new CredentialResetPermission(Guid.Empty).Allows(Guid.Empty, "ADMIN"));
    }

    [Fact]
    public void PasswordAndAuthenticatorResetsPreserveTheOtherCredential()
    {
        var now = new DateTime(2026, 11, 25, 0, 0, 0, DateTimeKind.Utc);
        var account = new TaiKhoan { Username = "fixture", HoTen = "Fixture", VaiTro = "CDCS", PasswordHash = "old",
            ProtectedMfaSecret = "protected-fixture", RecoveryCodeHashes = "stored-hashes", LastMfaStep = 42,
            ActivationCodeExpiresUtc = now.AddHours(3) };
        var initialVersion = account.SecurityVersion;
        AccountCredentials.IssueTemporaryPassword(account, now);
        Assert.Equal("protected-fixture", account.ProtectedMfaSecret);
        Assert.Equal("stored-hashes", account.RecoveryCodeHashes);
        Assert.Equal(42L, account.LastMfaStep);
        Assert.Equal(now.AddHours(3), account.ActivationCodeExpiresUtc);
        Assert.NotEqual(initialVersion, account.SecurityVersion);
        var passwordHash = account.PasswordHash;
        var passwordResetVersion = account.SecurityVersion;
        AccountCredentials.ResetAuthenticator(account, AccountCredentials.NewCode(), now.AddHours(1));
        Assert.Equal(passwordHash, account.PasswordHash);
        Assert.True(account.MustChangePassword);
        Assert.Equal(now.AddHours(24), account.TemporaryPasswordExpiresUtc);
        Assert.Equal(now.AddHours(25), account.ActivationCodeExpiresUtc);
        Assert.NotEqual(passwordResetVersion, account.SecurityVersion);
        Assert.Null(account.ProtectedMfaSecret);
        Assert.Null(account.LastMfaStep);
        Assert.Null(account.RecoveryCodeHashes);
    }

    [Fact]
    public void PasswordHashesUseIndependentSaltsAndRejectOldFormat()
    {
        const string sample = "sample passphrase for an isolated unit test";
        var first = PasswordHasher.Hash(sample);
        var second = PasswordHasher.Hash(sample);

        Assert.NotEqual(first, second);
        Assert.True(PasswordHasher.Verify(sample, first));
        Assert.False(PasswordHasher.Verify(sample + " different", first));
        Assert.False(PasswordHasher.Verify(sample, new string('a', 64)));
        Assert.False(PasswordHasher.IsAcceptable("short"));
    }

    [Fact]
    public async Task MissingAndUnknownRolesDoNotReceiveAnOrganizationScope()
    {
        using var database = CreateDatabase();
        var root = new DonViCongDoan { TenDonVi = "Fixture union", TrangThai = 1 };
        database.DonViCongDoans.Add(root);
        await database.SaveChangesAsync();

        foreach (var role in new[] { null, "DOANVIEN", "unknown" })
        {
            var user = new FixtureUser(Guid.NewGuid(), role, root.Id);
            var scope = new OrganizationScopeService(user, database);
            Assert.Empty((await scope.GetAllowedOrganizationIdsAsync())!);
            Assert.False(await scope.IsInScopeAsync(root.Id));
        }
    }

    [Fact]
    public async Task EvidenceRemainsWithItsAuthorizedRecordAfterAttachment()
    {
        using var database = CreateDatabase();
        var department = new DonViCongDoan { TenDonVi = "Fixture department", TrangThai = 1 };
        var uploader = new FixtureUser(Guid.NewGuid(), "CDBP", department.Id);
        var otherOwner = new FixtureUser(Guid.NewGuid(), "CDBP", department.Id);
        var scope = new OrganizationScopeService(uploader, database);
        database.DonViCongDoans.Add(department);
        var evidence = new EvidenceFile
        {
            OriginalFileName = "fixture.pdf",
            StoredFileName = "fixture.pdf",
            FileExtension = ".pdf",
            ContentType = "application/pdf",
            StoragePath = "fixture",
            ModuleName = "Activities",
            OrganizationId = department.Id,
            UploadedByUserId = uploader.UserId!.Value,
        };
        database.EvidenceFiles.Add(evidence);
        await database.SaveChangesAsync();

        var activity = Guid.NewGuid();
        var links = new EvidenceLinks(database, uploader, scope, TimeProvider.System);
        var otherLinks = new EvidenceLinks(database, otherOwner, scope, TimeProvider.System);
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            otherLinks.AttachAsync(evidence.Id.ToString(), "Activities", activity, department.Id, default));
        await links.AttachAsync(evidence.Id.ToString(), "Activities", activity, department.Id, default);
        await database.SaveChangesAsync();

        Assert.Equal(activity, evidence.RelatedEntityId);
        Assert.Equal(department.Id, evidence.OrganizationId);
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            links.AttachAsync(evidence.Id.ToString(), "Activities", Guid.NewGuid(), department.Id, default));
    }

    private static QLCDDbContext CreateDatabase() => new(new DbContextOptionsBuilder<QLCDDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);

    private sealed record FixtureUser(Guid? UserId, string? Role, Guid? OrganizationId) : ICurrentUserService
    {
        public string? Username => null;
        public bool IsAdmin => Role == "ADMIN";
        public bool IsCdcs => Role == "CDCS";
        public bool IsCdbp => Role == "CDBP";
        public bool IsTocd => Role == "TOCD";
    }
}
