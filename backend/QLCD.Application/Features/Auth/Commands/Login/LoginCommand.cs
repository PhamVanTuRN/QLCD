using QLCD.Application.Common;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Domain.Security;
using QLCD.Shared.Security;
using System.Security.Cryptography;
using System.Text.Json.Serialization;

namespace QLCD.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Username, string Password, string? MfaCode = null) : IRequest<LoginAttemptResult<LoginResult>>
{
    public bool BeginAuthenticator { get; init; }
    public string? ActivationCode { get; init; }
    [JsonIgnore]
    public MfaLoginProof? VerifiedPassword { get; init; }
    [JsonIgnore]
    public string? Trace { get; init; }
}

public sealed record SessionProfile(Guid Id, string Username, string HoTen, string VaiTro,
    Guid? OrganizationId, string? DonViTen, bool MustChangePassword, bool NeedsAuthenticator, bool RequiresActivation, bool HasRecoveryCodes,
    bool RecommendPasswordChange = false, bool ActivationVerified = false)
{
    public static SessionProfile From(TaiKhoan account, bool activationVerified = false)
    {
        var needsAuthenticator = account.ProtectedMfaSecret is null;
        var restricted = account.MustChangePassword || needsAuthenticator;
        return new SessionProfile(account.Id, account.Username, restricted ? account.Username : account.HoTen, account.VaiTro,
            restricted ? null : account.OrganizationId, restricted ? null : account.Organization?.TenDonVi,
            account.MustChangePassword, needsAuthenticator, account.ActivationCodeHash is not null, account.RecoveryCodeHashes is not null,
            !restricted && account.RecommendPasswordChange, needsAuthenticator && activationVerified);
    }
}

public sealed record MfaLoginProof(Guid AccountId, Guid SecurityVersion);

public sealed record LoginResult(string? SessionToken, DateTime ExpiresAtUtc, SessionProfile Profile, MfaLoginProof? Proof = null);

public interface IMfaVerifier
{
    bool TryVerify(TaiKhoan account, string? code, out long? step);
}

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(command => command.Username).NotEmpty().MaximumLength(50);
        RuleFor(command => command.Password).NotEmpty().MaximumLength(128).When(command => command.VerifiedPassword is null);
        RuleFor(command => command.MfaCode).Matches("^[0-9]{6}$").When(command => command.MfaCode is not null);
        RuleFor(command => command.ActivationCode).MaximumLength(32);
    }
}

public sealed class LoginCommandHandler(IQLCDDbContext context, IMfaVerifier mfa, TimeProvider clock)
    : IRequestHandler<LoginCommand, LoginAttemptResult<LoginResult>>
{
    public async Task<LoginAttemptResult<LoginResult>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var accountId = request.VerifiedPassword?.AccountId ?? await context.TaiKhoans.IgnoreQueryFilters()
            .Where(user => user.Username == username).Select(user => (Guid?)user.Id).SingleOrDefaultAsync(cancellationToken);
        var key = accountId is Guid id ? LoginAttemptGuard.AccountKey(id) : LoginAttemptGuard.UnknownKey(username);
        return await new LoginAttemptGuard(context, clock).RunAsync<LoginResult>(key, async attempt =>
        {
            var now = clock.GetUtcNow().UtcDateTime;
            var operational = context.DonViCongDoans.OperationalUnits();
            var account = await context.TaiKhoans.Include(user => user.Organization)
                .Where(user => user.OrganizationId == null || operational.Any(u => u.Id == user.OrganizationId))
                .SingleOrDefaultAsync(user => user.Id == accountId && user.TrangThai, cancellationToken);
            if (request.VerifiedPassword is { } proof)
            {
                if (account is null || !IsUsable(account) || proof.SecurityVersion != SessionVersion(account)
                    || account.ProtectedMfaSecret is null || (account.MustChangePassword && !(account.TemporaryPasswordExpiresUtc > now)))
                    return null;
                if (!mfa.TryVerify(account, request.MfaCode, out var step))
                {
                    attempt.Fail(account.Id, request.Trace);
                    return null;
                }
                account.LastMfaStep = step;
                attempt.CompleteSignIn();
                context.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id, "AUTH_LOGIN_SUCCESS", request.Trace));
                return CreateSession(context, account, now);
            }

            if (!PasswordHasher.Verify(request.Password, account?.PasswordHash) || account is null || !IsUsable(account)
                || !string.Equals(account.Username, username, StringComparison.OrdinalIgnoreCase)
                || (account.MustChangePassword && !(account.TemporaryPasswordExpiresUtc > now)))
            {
                attempt.Fail(accountId, request.Trace);
                return null;
            }

            if (account.ProtectedMfaSecret is not null)
                return new LoginResult(null, default, SessionProfile.From(account), new MfaLoginProof(account.Id, SessionVersion(account)));

            if (!(account.ActivationCodeExpiresUtc > now) || !AccountCredentials.MatchesHash(request.ActivationCode, account.ActivationCodeHash))
            {
                attempt.Fail(account.Id, request.Trace);
                return null;
            }
            return CreateSession(context, account, now, activationVerified: true);
        }, cancellationToken);
    }

    public static LoginResult CreateSession(IQLCDDbContext context, TaiKhoan account, DateTime now, bool activationVerified = false)
    {
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = now.AddMinutes(account.MustChangePassword || account.ProtectedMfaSecret is null ? 10 : 30);
        if (account.MustChangePassword && account.TemporaryPasswordExpiresUtc is DateTime deadline && deadline < expires)
            expires = deadline;
        if (activationVerified && account.ActivationCodeExpiresUtc is DateTime activationExpiry && activationExpiry < expires)
            expires = activationExpiry;
        var session = new AuthSession
        {
            AccountId = account.Id,
            SecurityVersion = SessionVersion(account),
            TokenHash = HashToken(token),
            ExpiresAtUtc = expires,
            ActivationVerified = activationVerified
        };
        context.AuthSessions.Add(session);
        return new LoginResult(token, session.ExpiresAtUtc, SessionProfile.From(account, activationVerified));
    }

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Convert.FromHexString(token)));

    public static Guid SessionVersion(TaiKhoan account)
    {
        var value = System.Text.Encoding.UTF8.GetBytes($"mfa-required:{account.SecurityVersion:N}:{account.VaiTro}:{account.OrganizationId:N}");
        return new Guid(SHA256.HashData(value).AsSpan(0, 16));
    }

    public static bool IsUsable(TaiKhoan account)
    {
        if (account.IsDeleted || !account.TrangThai
            || (account.OrganizationId != null && account.Organization is not { IsDeleted: false, TrangThai: 1 }))
            return false;
        if (account.VaiTro == SecurityRoles.Admin)
            return true;
        if (account.Organization is not { IsDeleted: false, TrangThai: 1 } organization)
            return false;

        return account.VaiTro switch
        {
            SecurityRoles.Central => organization.LoaiToChuc == LoaiToChuc.CDCS,
            SecurityRoles.Department => organization.LoaiToChuc == LoaiToChuc.CDBP,
            SecurityRoles.Team => organization.LoaiToChuc is LoaiToChuc.TO_CD_THUOC_CDBP or LoaiToChuc.TO_CD_TRUC_THUOC_CDCS,
            _ => false
        };
    }
}
