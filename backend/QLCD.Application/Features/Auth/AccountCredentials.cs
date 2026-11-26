using System.Security.Cryptography;
using System.Text;
using QLCD.Domain.Entities;
using QLCD.Shared.Security;

namespace QLCD.Application.Features.Auth;

public static class AccountCredentials
{
    public const string InitialPassword = PasswordHasher.InitialPassword;
    public const int TemporaryPasswordLifetimeHours = 24;
    public const int ActivationCodeLifetimeHours = 24;

    public static bool IsCode(string? value) => value is { Length: 32 } && value.All(Uri.IsHexDigit);

    public static string NewCode() => Convert.ToHexString(RandomNumberGenerator.GetBytes(16));

    public static bool CanIssueInitialActivation(TaiKhoan account) =>
        account.ProtectedMfaSecret is null && account.ActivationCodeHash is null;

    public static string HashCode(string code) => Convert.ToHexString(SHA256.HashData(Encoding.ASCII.GetBytes(code.ToUpperInvariant())));

    public static bool MatchesHash(string? code, string? hash) => IsCode(code) && hash is { Length: 64 }
        && CryptographicOperations.FixedTimeEquals(Encoding.ASCII.GetBytes(HashCode(code!)), Encoding.ASCII.GetBytes(hash));

    public static bool MatchesRecoveryCode(TaiKhoan account, string? code) =>
        account.RecoveryCodeHashes?.Split(',').Any(hash => MatchesHash(code, hash)) == true;

    public static string[] RotateRecoveryCodes(TaiKhoan account)
    {
        var codes = Enumerable.Range(0, 10).Select(_ => NewCode()).ToArray();
        account.RecoveryCodeHashes = string.Join(',', codes.Select(HashCode));
        return codes;
    }

    public static void IssueActivation(TaiKhoan account, string activation, DateTime now)
    {
        IssueTemporaryPassword(account, now);
        ResetAuthenticator(account, activation, now);
    }

    public static void IssueTemporaryPassword(TaiKhoan account, DateTime now)
    {
        account.PasswordHash = PasswordHasher.Hash(InitialPassword);
        account.MustChangePassword = true;
        account.RecommendPasswordChange = false;
        account.TemporaryPasswordExpiresUtc = now.AddHours(TemporaryPasswordLifetimeHours);
        account.SecurityVersion = Guid.NewGuid();
    }

    public static void ResetAuthenticator(TaiKhoan account, string activation, DateTime now)
    {
        account.ProtectedMfaSecret = null;
        account.LastMfaStep = null;
        account.RecoveryCodeHashes = null;
        IssueEnrollment(account, activation, now);
    }

    public static void IssueEnrollment(TaiKhoan account, string activation, DateTime now)
    {
        account.ActivationCodeExpiresUtc = now.AddHours(ActivationCodeLifetimeHours);
        account.ActivationCodeHash = HashCode(activation);
        account.SecurityVersion = Guid.NewGuid();
    }

    public static AuditLog Event(Guid actor, Guid target, string action, string? trace = null) => new()
    {
        EntityName = nameof(TaiKhoan), RecordId = target, UserId = actor.ToString(), Action = action, CorrelationId = trace
    };
}
