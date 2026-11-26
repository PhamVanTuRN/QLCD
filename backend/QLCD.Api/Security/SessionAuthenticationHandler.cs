using QLCD.Application.Common;
using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth.Commands.Login;

namespace QLCD.Api.Security;

public sealed record AuthenticatedSession(Guid Id, Guid SecurityVersion, SessionProfile Profile);

public sealed class SessionAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IQLCDDbContext database,
    IWebHostEnvironment environment,
    TimeProvider clock) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "QLCD.Session";
    public static string CookieName(IWebHostEnvironment environment) =>
        environment.IsDevelopment() || environment.IsEnvironment("Testing") ? "QLCD-Session" : "__Host-QLCD-Session";

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Cookies.TryGetValue(CookieName(environment), out var token))
            return AuthenticateResult.NoResult();

        if (token.Length != 64 || !token.All(Uri.IsHexDigit))
            return AuthenticateResult.Fail("Invalid session.");

        var hash = LoginCommandHandler.HashToken(token);
        var now = clock.GetUtcNow().UtcDateTime;
        try
        {
            var session = await database.AuthSessions.AsNoTracking()
                .Include(value => value.Account).ThenInclude(account => account.Organization)
                .SingleOrDefaultAsync(value => value.TokenHash == hash && value.ExpiresAtUtc > now, Context.RequestAborted);

            if (session is null || session.SecurityVersion != LoginCommandHandler.SessionVersion(session.Account)
                || !LoginCommandHandler.IsUsable(session.Account))
                return AuthenticateResult.Fail("Invalid session.");

            var account = session.Account;
            if (account.OrganizationId is Guid organizationId && !await database.DonViCongDoans.OperationalUnits()
                .AnyAsync(u => u.Id == organizationId, Context.RequestAborted))
                return AuthenticateResult.Fail("Inactive organization.");
            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, account.Id.ToString()),
                new(ClaimTypes.Name, account.Username),
            };
            if (!account.MustChangePassword && account.ProtectedMfaSecret is not null)
            {
                claims.Add(new Claim(ClaimTypes.Role, account.VaiTro));
                if (account.OrganizationId is Guid organization)
                    claims.Add(new Claim("OrganizationId", organization.ToString()));
            }

            Context.Features.Set(new AuthenticatedSession(session.Id, session.SecurityVersion, SessionProfile.From(account)));
            var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
            return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
        }
        catch (System.Data.Common.DbException)
        {
            throw new SecurityStoreUnavailableException();
        }
    }
}

public sealed class SecurityStoreUnavailableException : Exception;
