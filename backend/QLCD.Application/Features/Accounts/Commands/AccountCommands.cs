using QLCD.Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Entities;
using QLCD.Domain.Security;
using QLCD.Shared.Security;

namespace QLCD.Application.Features.Accounts.Commands;

public sealed record ToggleAccount(Guid AccountId) : IRequest<bool>;
public sealed record UnlockAccount(Guid AccountId, string CurrentPassword, string Code, Guid SessionVersion, string Trace) : IRequest<UnlockAccountResult>;
public sealed record UnlockAccountResult(bool AccountActive, bool OrganizationRestored, Guid OrganizationId);
public sealed class AdminUnlockAuthenticationException : UnauthorizedAccessException;

public sealed record IssueAccountActivation(Guid AccountId, bool IdentityVerified, string Trace) : IRequest<string>;
public sealed record ResetAccountPassword(Guid AccountId, string CurrentPassword, string Code, Guid SessionVersion, string Trace) : IRequest;
public sealed record ResetAccountAuthenticator(Guid AccountId, string CurrentPassword, string Code, Guid SessionVersion, string Trace) : IRequest<string>;

public sealed class AccountCommands(IQLCDDbContext database, ICurrentUserService user, TimeProvider clock, IMfaVerifier mfa,
    CredentialResetPermission permission)
    : IRequestHandler<ToggleAccount, bool>, IRequestHandler<UnlockAccount, UnlockAccountResult>, IRequestHandler<IssueAccountActivation, string>,
    IRequestHandler<ResetAccountPassword>, IRequestHandler<ResetAccountAuthenticator, string>
{
    public async Task<bool> Handle(ToggleAccount request, CancellationToken cancellationToken)
    {
        var account = await LoadAsync(request.AccountId, cancellationToken);
        if (account.IsDeleted || !account.TrangThai)
            throw new OrganizationStateException("Mở khóa yêu cầu xác nhận, mật khẩu và OTP của admin qua thao tác Mở khóa riêng.");
        account.TrangThai = false;
        account.SecurityVersion = Guid.NewGuid();
        await database.SaveChangesAsync(cancellationToken);
        return account.TrangThai;
    }

    public async Task<UnlockAccountResult> Handle(UnlockAccount request, CancellationToken cancellationToken)
    {
        await using var transaction = database.Database.IsRelational()
            ? await database.Database.BeginTransactionAsync(System.Data.IsolationLevel.Serializable, cancellationToken) : null;
        var target = await LoadAsync(request.AccountId, cancellationToken);
        var actor = await database.TaiKhoans.Include(a => a.Organization)
            .SingleOrDefaultAsync(a => a.Id == user.UserId, cancellationToken);
        if (actor is null || actor.VaiTro != SecurityRoles.Admin || !LoginCommandHandler.IsUsable(actor)
            || actor.MustChangePassword || actor.ProtectedMfaSecret is null
            || LoginCommandHandler.SessionVersion(actor) != request.SessionVersion
            || !PasswordHasher.Verify(request.CurrentPassword, actor.PasswordHash)
            || !mfa.TryVerify(actor, request.Code, out var used))
            throw new AdminUnlockAuthenticationException();
        if (target.OrganizationId is not Guid organizationId)
            throw new OrganizationStateException("Tài khoản chưa liên kết đơn vị hợp lệ; không tự tạo đơn vị khi mở khóa.");
        var organization = await database.DonViCongDoans.IgnoreQueryFilters().SingleOrDefaultAsync(u => u.Id == organizationId, cancellationToken)
            ?? throw new KeyNotFoundException("Đơn vị không tồn tại.");
        var restored = organization.IsDeleted || organization.TrangThai != 1;
        if (!await database.DonViCongDoans.OperationalUnits().AnyAsync(u => u.Id == organizationId, cancellationToken))
            await OrganizationLifecycle.ChangeAsync(database, user, organizationId, true, cancellationToken);
        actor.LastMfaStep = used;
        target.TrangThai = true;
        target.IsDeleted = false;
        target.SecurityVersion = Guid.NewGuid();
        database.AuditLogs.Add(AccountCredentials.Event(user.UserId!.Value, target.Id, "AUTH_ACCOUNT_UNLOCK", request.Trace));
        await database.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
        return new UnlockAccountResult(true, restored, organizationId);
    }

    public async Task<string> Handle(IssueAccountActivation request, CancellationToken cancellationToken)
    {
        if (!request.IdentityVerified) throw new ArgumentException("Verify the user's identity before issuing a code.");
        var account = await LoadAsync(request.AccountId, cancellationToken);
        if (account.OrganizationId is not Guid unitId || !await database.DonViCongDoans.OperationalUnits().AnyAsync(u => u.Id == unitId, cancellationToken))
            throw new OrganizationStateException("Hãy mở khóa và khôi phục đơn vị bằng mật khẩu/OTP của admin trước khi cấp mã kích hoạt.");
        if (account.IsDeleted || !AccountCredentials.CanIssueInitialActivation(account))
            throw new ArgumentException("Use the verified account recovery workflow for this account.");

        var activation = AccountCredentials.NewCode();
        var now = clock.GetUtcNow().UtcDateTime;
        AccountCredentials.IssueEnrollment(account, activation, now);
        if (account.MustChangePassword && account.TemporaryPasswordExpiresUtc is null)
        {
            account.TemporaryPasswordExpiresUtc = now.AddHours(AccountCredentials.TemporaryPasswordLifetimeHours);
            account.TrangThai = true;
        }
        database.AuditLogs.Add(AccountCredentials.Event(user.UserId!.Value, account.Id, "AUTH_ACTIVATE", request.Trace));
        await database.SaveChangesAsync(cancellationToken);
        return activation;
    }

    public async Task Handle(ResetAccountPassword request, CancellationToken cancellationToken)
    {
        var account = await LoadForReset(request.AccountId, request.CurrentPassword, request.Code, request.SessionVersion, cancellationToken);
        AccountCredentials.IssueTemporaryPassword(account, clock.GetUtcNow().UtcDateTime);
        database.AuditLogs.Add(AccountCredentials.Event(user.UserId!.Value, account.Id, "AUTH_PASSWORD_RESET", request.Trace));
        await database.SaveChangesAsync(cancellationToken);
    }

    public async Task<string> Handle(ResetAccountAuthenticator request, CancellationToken cancellationToken)
    {
        var account = await LoadForReset(request.AccountId, request.CurrentPassword, request.Code, request.SessionVersion, cancellationToken);
        var activation = AccountCredentials.NewCode();
        AccountCredentials.ResetAuthenticator(account, activation, clock.GetUtcNow().UtcDateTime);
        database.AuditLogs.Add(AccountCredentials.Event(user.UserId!.Value, account.Id, "AUTH_MFA_RESET", request.Trace));
        await database.SaveChangesAsync(cancellationToken);
        return activation;
    }

    private async Task<TaiKhoan> LoadForReset(Guid id, string password, string code, Guid sessionVersion, CancellationToken cancellationToken)
    {
        if (user.UserId == id || !permission.Allows(user.UserId, user.Role))
            throw new UnauthorizedAccessException("Account reset permission is required for another account.");

        var actor = await database.TaiKhoans.SingleOrDefaultAsync(row => row.Id == user.UserId, cancellationToken);
        if (actor is null || !permission.Allows(actor.Id, actor.VaiTro)
            || !LoginCommandHandler.IsUsable(actor) || actor.MustChangePassword
            || LoginCommandHandler.SessionVersion(actor) != sessionVersion
            || !PasswordHasher.Verify(password, actor.PasswordHash) || !mfa.TryVerify(actor, code, out var used))
            throw new UnauthorizedAccessException("Administrator reauthentication failed.");

        var target = await database.TaiKhoans.SingleOrDefaultAsync(row => row.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Account not found.");
        actor.LastMfaStep = used;
        return target;
    }

    private async Task<TaiKhoan> LoadAsync(Guid id, CancellationToken cancellationToken)
    {
        if (user.Role != SecurityRoles.Admin || user.UserId is null || user.UserId == id)
            throw new UnauthorizedAccessException("Self-service uses the authenticated password-change operation.");

        var account = await database.TaiKhoans.IgnoreQueryFilters().SingleOrDefaultAsync(value => value.Id == id, cancellationToken)
            ?? throw new KeyNotFoundException("Account not found.");
        if (account.VaiTro == SecurityRoles.Admin)
            throw new UnauthorizedAccessException("Administrator lifecycle is managed through separate maintenance.");

        return account;
    }
}
