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

public record LoginCommand(string Username, string Password, string? MfaCode = null) : IRequest<LoginResult?>
{
    public bool BeginAuthenticator { get; init; }
    [JsonIgnore]
    public MfaLoginProof? VerifiedPassword { get; init; }
}

public sealed record SessionProfile(Guid Id, string Username, string HoTen, string VaiTro,
    Guid? OrganizationId, string? DonViTen, bool MustChangePassword, bool NeedsAuthenticator, bool RequiresActivation, bool HasRecoveryCodes)
{
    public static SessionProfile From(TaiKhoan account)
    {
        var needsAuthenticator = account.ProtectedMfaSecret is null;
        var restricted = account.MustChangePassword || needsAuthenticator;
        return new SessionProfile(account.Id, account.Username, restricted ? account.Username : account.HoTen, account.VaiTro,
            restricted ? null : account.OrganizationId, restricted ? null : account.Organization?.TenDonVi,
            account.MustChangePassword, needsAuthenticator, account.ActivationCodeHash is not null, account.RecoveryCodeHashes is not null);
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
    }
}

public sealed class LoginCommandHandler(IQLCDDbContext context, IMfaVerifier mfa, TimeProvider clock)
    : IRequestHandler<LoginCommand, LoginResult?>
{
    public async Task<LoginResult?> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim().ToLowerInvariant();
        var now = clock.GetUtcNow().UtcDateTime;
        var account = await context.TaiKhoans.Include(user => user.Organization)
            .SingleOrDefaultAsync(user => user.Username == username && user.TrangThai, cancellationToken);
        var passwordMatches = request.VerifiedPassword is { } proof
            ? account is not null && proof.AccountId == account.Id && proof.SecurityVersion == SessionVersion(account)
                && account.ProtectedMfaSecret is not null
            : PasswordHasher.Verify(request.Password, account?.PasswordHash);
        if (account is null || !passwordMatches || !IsUsable(account)
            || (account.MustChangePassword && !(account.TemporaryPasswordExpiresUtc > now)))
            return null;

        if (request.VerifiedPassword is null && account.ProtectedMfaSecret is not null)
            return new LoginResult(null, default, SessionProfile.From(account), new MfaLoginProof(account.Id, SessionVersion(account)));

        if (account.ProtectedMfaSecret is not null)
        {
            if (!mfa.TryVerify(account, request.MfaCode, out var step))
                return null;
            account.LastMfaStep = step;
        }

        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var expires = now.AddMinutes(account.MustChangePassword || account.ProtectedMfaSecret is null ? 10 : 30);
        if (account.MustChangePassword && account.TemporaryPasswordExpiresUtc is DateTime deadline && deadline < expires)
            expires = deadline;
        var session = new AuthSession
        {
            AccountId = account.Id,
            SecurityVersion = SessionVersion(account),
            TokenHash = HashToken(token),
            ExpiresAtUtc = expires
        };
        context.AuthSessions.Add(session);
        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            return null;
        }
        return new LoginResult(token, session.ExpiresAtUtc, SessionProfile.From(account));
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
        if (!account.TrangThai)
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
