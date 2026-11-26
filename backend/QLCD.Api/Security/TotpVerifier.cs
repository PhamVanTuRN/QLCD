using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using OtpNet;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Entities;

namespace QLCD.Api.Security;

public sealed class TotpVerifier(IDataProtectionProvider protection, TimeProvider clock)
    : IMfaVerifier
{
    public bool TryVerify(TaiKhoan account, string? code, out long? step)
    {
        step = null;
        if (account.ProtectedMfaSecret is null)
            return false;

        return TryVerifySecret(account.Id, account.ProtectedMfaSecret, code, account.LastMfaStep, out step);
    }

    public bool TryVerifySecret(Guid accountId, string protectedSecret, string? code, long? lastStep, out long? step)
    {
        step = null;
        if (code is not { Length: 6 } || !code.All(char.IsAsciiDigit))
            return false;
        byte[] key;
        try
        {
            key = Convert.FromBase64String(ForUser(accountId).Unprotect(protectedSecret));
        }
        catch (Exception exception) when (exception is CryptographicException or FormatException)
        {
            return false;
        }

        try
        {
            var totp = new Totp(key);
            if (!totp.VerifyTotp(clock.GetUtcNow().UtcDateTime, code, out var used, new VerificationWindow(1, 1))
                || lastStep >= used)
                return false;
            step = used;
            return true;
        }
        finally
        {
            CryptographicOperations.ZeroMemory(key);
        }
    }

    public static string GenerateKey()
    {
        var bytes = RandomNumberGenerator.GetBytes(20);
        try { return Base32Encoding.ToString(bytes); }
        finally { CryptographicOperations.ZeroMemory(bytes); }
    }

    public string Protect(Guid accountId, string base32Secret)
    {
        var key = Base32Encoding.ToBytes(base32Secret);
        try
        {
            if (key.Length is < 20 or > 64)
                throw new ArgumentException("MFA secret must contain 20 to 64 random bytes.");
            return ForUser(accountId).Protect(Convert.ToBase64String(key));
        }
        finally
        {
            CryptographicOperations.ZeroMemory(key);
        }
    }

    public string ReadSetupKey(Guid accountId, string protectedSecret)
    {
        var key = Convert.FromBase64String(ForUser(accountId).Unprotect(protectedSecret));
        try { return Base32Encoding.ToString(key); }
        finally { CryptographicOperations.ZeroMemory(key); }
    }

    private IDataProtector ForUser(Guid accountId) =>
        protection.CreateProtector("QLCD.Totp.v1", accountId.ToString());
}
