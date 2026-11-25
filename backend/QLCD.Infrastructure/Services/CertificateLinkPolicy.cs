using Microsoft.Extensions.Configuration;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Infrastructure.Services;

public sealed class CertificateLinkPolicy : ICertificateLinkPolicy
{
    private readonly HashSet<string> origins;

    public CertificateLinkPolicy(IConfiguration configuration)
    {
        origins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var item in configuration.GetSection("Security:CertificateOrigins").Get<string[]>() ?? [])
        {
            if (!Uri.TryCreate(item, UriKind.Absolute, out var origin) || origin.Scheme != Uri.UriSchemeHttps
                || origin.AbsolutePath != "/" || origin.UserInfo.Length > 0 || origin.Query.Length > 0 || origin.Fragment.Length > 0)
                throw new InvalidOperationException("Certificate origins must be HTTPS origins.");

            origins.Add(origin.GetLeftPart(UriPartial.Authority));
        }
    }

    public string? AllowedUrl(string? candidate) =>
        candidate is { Length: > 0 and <= 500 } && Uri.TryCreate(candidate, UriKind.Absolute, out var uri)
        && uri.Scheme == Uri.UriSchemeHttps && uri.UserInfo.Length == 0 && !candidate.Any(char.IsControl)
        && origins.Contains(uri.GetLeftPart(UriPartial.Authority)) ? uri.AbsoluteUri : null;
}
