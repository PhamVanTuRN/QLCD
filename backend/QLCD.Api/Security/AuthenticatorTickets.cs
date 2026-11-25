using System.Security.Cryptography;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using QLCD.Application.Features.Auth.Commands.Login;

namespace QLCD.Api.Security;

internal static class AuthenticatorTickets
{
    public const string LoginPurpose = "QLCD.AuthenticatorLogin.v2";
    public static string Protect<T>(this IDataProtectionProvider protection, string purpose, T value, TimeSpan lifetime) =>
        protection.CreateProtector(purpose).ToTimeLimitedDataProtector().Protect(JsonSerializer.Serialize(value), lifetime);

    public static T? Read<T>(this IDataProtectionProvider protection, string purpose, string value) where T : class
    {
        try
        {
            var json = protection.CreateProtector(purpose).ToTimeLimitedDataProtector().Unprotect(value);
            return JsonSerializer.Deserialize<T>(json);
        }
        catch (Exception exception) when (exception is CryptographicException or JsonException or FormatException)
        {
            return null;
        }
    }
}

internal sealed record AuthenticatorLoginChallenge(string Username, MfaLoginProof Proof);
