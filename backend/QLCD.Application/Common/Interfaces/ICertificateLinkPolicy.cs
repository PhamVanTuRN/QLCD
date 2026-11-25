namespace QLCD.Application.Common.Interfaces;

public interface ICertificateLinkPolicy
{
    string? AllowedUrl(string? candidate);

    string? RequireAllowedUrl(string? candidate) => string.IsNullOrWhiteSpace(candidate)
        ? null : AllowedUrl(candidate) ?? throw new ArgumentException("Certificate URL requires an approved HTTPS origin.");
}
