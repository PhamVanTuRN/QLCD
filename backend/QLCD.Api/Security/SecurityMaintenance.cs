using Microsoft.EntityFrameworkCore;
using QLCD.Domain.Entities;
using QLCD.Domain.Security;
using QLCD.Infrastructure.Data;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Accounts.Commands;

namespace QLCD.Api.Security;

public static class SecurityMaintenance
{
    public static async Task<int> ExpirePendingEvidenceAsync(IServiceProvider services, IConfiguration configuration)
    {
        var retention = configuration.GetValue<int>("Storage:PendingRetentionDays");
        if (retention is < 2 or > 365)
            throw new InvalidOperationException("Set an approved pending evidence retention of 2 to 365 days.");

        var database = services.GetRequiredService<QLCDDbContext>();
        var storage = services.GetRequiredService<EvidenceStorage>();
        var cutoff = TimeProvider.System.GetUtcNow().UtcDateTime.AddDays(-retention);
        var files = await database.EvidenceFiles.IgnoreQueryFilters()
            .Where(file => file.ContentValidated && file.RelatedEntityId == Guid.Empty && file.UploadedAt < cutoff)
            .OrderBy(file => file.UploadedAt).Take(100).ToListAsync();

        // At this age the attachment service can no longer attach the file to a record.
        foreach (var file in files)
            storage.TryDelete(file.Id);
        database.EvidenceFiles.RemoveRange(files);
        await database.SaveChangesAsync();
        return files.Count;
    }

    public static async Task ProvisionAccountAsync(IServiceProvider services, IConfiguration configuration, bool bootstrapAdministrator,
        bool enrollmentOnly = false)
    {
        var username = configuration["Bootstrap:Username"]?.Trim().ToLowerInvariant();
        var activation = configuration["Bootstrap:ActivationCode"];
        if (string.IsNullOrWhiteSpace(username) || username.Length > 50 || !AccountCredentials.IsCode(activation))
            throw new InvalidOperationException("Provide a valid bootstrap username and a separate 32-hex-character activation code.");

        var database = services.GetRequiredService<QLCDDbContext>();
        var resetPermission = services.GetRequiredService<CredentialResetPermission>();
        var account = await database.TaiKhoans.SingleOrDefaultAsync(value => value.Username == username);
        if (account is null)
        {
            if (!bootstrapAdministrator)
                throw new InvalidOperationException("Only an existing account can be provisioned with this command.");

            account = new TaiKhoan
            {
                Username = username,
                HoTen = "Quản trị hệ thống",
                PasswordHash = "",
                VaiTro = SecurityRoles.Admin
            };
            if (username == CredentialResetPermission.AdminUsername && resetPermission.AccountId is Guid adminId)
                account.Id = adminId;
            database.TaiKhoans.Add(account);
        }
        else if (bootstrapAdministrator)
        {
            throw new InvalidOperationException("The account already exists. Use the provisioning command.");
        }

        var now = TimeProvider.System.GetUtcNow().UtcDateTime;
        if (enrollmentOnly)
        {
            if (!account.TrangThai || account.ProtectedMfaSecret is not null || string.IsNullOrEmpty(account.PasswordHash))
                throw new InvalidOperationException("Only an active account with an existing password and without an authenticator is eligible.");
            AccountCredentials.IssueEnrollment(account, activation!, now);
        }
        else
        {
            if (!bootstrapAdministrator && !resetPermission.Allows(account.Id, account.Username, account.VaiTro))
                throw new InvalidOperationException("Offline provisioning is reserved for recovery of the designated administrator.");
            AccountCredentials.IssueActivation(account, activation!, now);
            account.TrangThai = true;
        }
        database.AuditLogs.Add(new AuditLog { EntityName = nameof(TaiKhoan), RecordId = account.Id,
            Action = bootstrapAdministrator ? "AUTH_BOOTSTRAP" : enrollmentOnly ? "AUTH_ENROLL_CODE" : "AUTH_OPERATOR_RESET", UserId = "System" });
        await database.SaveChangesAsync();
    }
}
