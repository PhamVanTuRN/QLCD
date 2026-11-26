using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using QLCD.Api.Security;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Domain.Entities;
using QLCD.Shared.Security;
using QRCoder;

namespace QLCD.Api.Controllers;

[ApiController]
[Authorize(Policy = "Session")]
[Route("api/v1/auth/authenticator")]
[RequestSizeLimit(4096)]
public sealed class AuthenticatorController(
    IQLCDDbContext database, TotpVerifier totp, IDataProtectionProvider protection,
    LoginThrottle throttle, TimeProvider clock, IWebHostEnvironment environment) : ControllerBase
{
    private const string SetupPurpose = "QLCD.AuthenticatorSetup.v2";
    private const string RecoveryPurpose = "QLCD.AuthenticatorRecovery.v1";
    private const string Issuer = "Cong doan so 108";
    private AuthenticatedSession Session => HttpContext.Features.Get<AuthenticatedSession>()!;

    [HttpGet]
    public async Task<IActionResult> Status(CancellationToken cancellationToken)
    {
        var account = await LoadCurrent(cancellationToken);
        return account is null ? Unauthorized() : Ok(new { success = true, data = SessionProfile.From(account, Session.Profile.ActivationVerified) });
    }

    [HttpPost("setup")]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    public async Task<IActionResult> Setup(AuthenticatorSetupRequest request, CancellationToken cancellationToken)
    {
        return await GuardLogin(Session.Profile.Id, async attempt =>
        {
            var account = await LoadCurrent(cancellationToken);
            var session = await database.AuthSessions.FindAsync([Session.Id], cancellationToken);
            if (account is null || session is null || session.ExpiresAtUtc <= clock.GetUtcNow().UtcDateTime) return Unauthorized();
            if (account.ProtectedMfaSecret is not null) return Conflict();
            if (!(account.ActivationCodeExpiresUtc > clock.GetUtcNow().UtcDateTime)) return ExpiredSetup();
            if (!session.ActivationVerified && (!PasswordHasher.Verify(request.CurrentPassword ?? "", account.PasswordHash)
                || !AccountCredentials.MatchesHash(request.ActivationCode, account.ActivationCodeHash)))
            {
                attempt.Fail(account.Id, HttpContext.TraceIdentifier);
                return InvalidLoginFactor();
            }

            session.ActivationVerified = true;
            session.ProtectedEnrollmentKey ??= totp.Protect(account.Id, TotpVerifier.GenerateKey());
            return CreateSetup(account, SetupPurpose, session.Id, session.ProtectedEnrollmentKey);
        }, cancellationToken);
    }

    [HttpPost("confirm")]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    public async Task<IActionResult> Confirm(AuthenticatorConfirmRequest request, CancellationToken cancellationToken)
    {
        var pending = protection.Read<PendingAuthenticator>(SetupPurpose, request.Setup);
        if (pending?.SessionId != Session.Id) return ExpiredSetup();
        LoginResult? login = null;
        var result = await GuardLogin(Session.Profile.Id, async attempt =>
        {
            var account = await LoadCurrent(cancellationToken);
            var session = await database.AuthSessions.FindAsync([Session.Id], cancellationToken);
            var now = clock.GetUtcNow().UtcDateTime;
            if (account is null || session is null || session.ExpiresAtUtc <= now) return Unauthorized();
            if (account.ProtectedMfaSecret is not null || account.ActivationCodeHash is null || !(account.ActivationCodeExpiresUtc > now)
                || (session.ProtectedEnrollmentKey is not null && pending!.ProtectedSecret != session.ProtectedEnrollmentKey))
                return ExpiredSetup();
            if (!VerifySetup(account, pending!, request.Code, attempt, out var step)) return InvalidLoginFactor();

            // A password reset can precede enrollment; only the initial password policy can be deferred.
            if (account.MustChangePassword && !await database.AuditLogs.AnyAsync(row => row.RecordId == account.Id
                && row.EntityName == nameof(TaiKhoan) && (row.Action == "AUTH_PASSWORD_RESET" || row.Action == "AUTH_OPERATOR_RESET"), cancellationToken))
            {
                account.MustChangePassword = false;
                account.RecommendPasswordChange = true;
                account.TemporaryPasswordExpiresUtc = null;
            }
            var codes = ApplySetup(account, pending!, step, "MFA_ENROLL");
            database.AuthSessions.Remove(session);
            login = LoginCommandHandler.CreateSession(database, account, now);
            attempt.CompleteSignIn();
            database.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id, "AUTH_LOGIN_SUCCESS", HttpContext.TraceIdentifier));
            return Ok(new { success = true, data = new { codes } });
        }, cancellationToken);
        if (login is not null)
            Response.Cookies.Append(SessionAuthenticationHandler.CookieName(environment), login.SessionToken!,
                SessionAuthenticationHandler.CookieOptions(environment, login.ExpiresAtUtc));
        return result;
    }

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    [HttpPost("recovery")]
    public async Task<IActionResult> Recover(AuthenticatorRecoveryRequest request, CancellationToken cancellationToken)
    {
        var challenge = protection.Read<AuthenticatorLoginChallenge>(AuthenticatorTickets.LoginPurpose, request.Challenge);
        if (challenge is null) return ExpiredSetup();
        return await GuardLogin(challenge.Proof.AccountId, async attempt =>
        {
            var account = await FindUsable(challenge.Proof.AccountId, challenge.Proof.SecurityVersion, cancellationToken);
            if (account?.ProtectedMfaSecret is null) return ExpiredSetup();
            if (!AccountCredentials.MatchesRecoveryCode(account, request.RecoveryCode))
            {
                attempt.Fail(account.Id, HttpContext.TraceIdentifier);
                return InvalidLoginFactor();
            }
            return CreateSetup(account, RecoveryPurpose, null, totp.Protect(account.Id, TotpVerifier.GenerateKey()));
        }, cancellationToken);
    }

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    [HttpPost("recovery/confirm")]
    public async Task<IActionResult> ConfirmRecovery(AuthenticatorConfirmRequest request, CancellationToken cancellationToken)
    {
        var pending = protection.Read<PendingAuthenticator>(RecoveryPurpose, request.Setup);
        if (pending is null) return ExpiredSetup();
        return await GuardLogin(pending.AccountId, async attempt =>
        {
            var account = await FindUsable(pending.AccountId, pending.SecurityVersion, cancellationToken);
            if (account?.ProtectedMfaSecret is null) return ExpiredSetup();
            if (!VerifySetup(account, pending, request.Code, attempt, out var step)) return InvalidLoginFactor();
            var codes = ApplySetup(account, pending, step, "MFA_RECOVERY");
            return Ok(new { success = true, data = new { codes } });
        }, cancellationToken);
    }

    [Authorize(Roles = QLCD.Domain.Security.SecurityRoles.Staff)]
    [HttpPost("recovery-codes")]
    public async Task<IActionResult> Rotate(AuthenticatorReauthenticateRequest request, CancellationToken cancellationToken)
    {
        if (!throttle.TryAcquireAuthenticatorChange(Session.Profile.Id)) return RateLimited();
        var account = await LoadCurrent(cancellationToken);
        if (account is null) return Unauthorized();
        if (!PasswordHasher.Verify(request.CurrentPassword, account.PasswordHash) || !totp.TryVerify(account, request.Code, out var step))
            return BadRequest(new { success = false, message = "Mật khẩu hoặc mã Authenticator không hợp lệ." });
        account.LastMfaStep = step;
        var codes = AccountCredentials.RotateRecoveryCodes(account);
        // Invalidate any replacement tickets issued against the previous set, and keep only this session.
        await RotateStamp(account, Session.Id, cancellationToken);
        database.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id, "RECOVERY_CODES", HttpContext.TraceIdentifier));
        await database.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true, data = new { codes } });
    }

    private IActionResult CreateSetup(TaiKhoan account, string purpose, Guid? sessionId, string protectedSecret)
    {
        var key = totp.ReadSetupKey(account.Id, protectedSecret);
        var setup = protection.Protect(purpose,
            new PendingAuthenticator(account.Id, sessionId, LoginCommandHandler.SessionVersion(account), protectedSecret), TimeSpan.FromMinutes(10));
        var issuer = Uri.EscapeDataString(Issuer);
        var label = Uri.EscapeDataString(account.Username);
        var uri = $"otpauth://totp/{issuer}:{label}?secret={key}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";
        var png = PngByteQRCodeHelper.GetQRCode(uri, QRCodeGenerator.ECCLevel.M, 5);
        return Ok(new { success = true, data = new { setup, key, qrImage = $"data:image/png;base64,{Convert.ToBase64String(png)}" } });
    }

    private bool VerifySetup(TaiKhoan account, PendingAuthenticator pending, string code, LoginAttemptGuard.Attempt attempt, out long? step)
    {
        step = null;
        if (pending.AccountId != account.Id || pending.SecurityVersion != LoginCommandHandler.SessionVersion(account))
            return false;
        if (totp.TryVerifySecret(account.Id, pending.ProtectedSecret, code, null, out step)) return true;
        attempt.Fail(account.Id, HttpContext.TraceIdentifier);
        return false;
    }

    private string[] ApplySetup(TaiKhoan account, PendingAuthenticator pending, long? step, string action)
    {
        account.ProtectedMfaSecret = pending.ProtectedSecret;
        account.ActivationCodeHash = null;
        account.ActivationCodeExpiresUtc = null;
        account.LastMfaStep = step;
        account.SecurityVersion = Guid.NewGuid();
        database.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id, action, HttpContext.TraceIdentifier));
        return AccountCredentials.RotateRecoveryCodes(account);
    }

    private async Task RotateStamp(TaiKhoan account, Guid? keepSession, CancellationToken cancellationToken)
    {
        account.SecurityVersion = Guid.NewGuid();
        if (keepSession is not Guid id) return;
        var session = await database.AuthSessions.FindAsync([id], cancellationToken);
        if (session is not null) session.SecurityVersion = LoginCommandHandler.SessionVersion(account);
    }

    private Task<TaiKhoan?> LoadCurrent(CancellationToken cancellationToken) =>
        FindUsable(Session.Profile.Id, Session.SecurityVersion, cancellationToken);

    private async Task<TaiKhoan?> FindUsable(Guid accountId, Guid version, CancellationToken cancellationToken)
    {
        var operational = database.DonViCongDoans.OperationalUnits();
        var account = await database.TaiKhoans.Include(row => row.Organization)
            .Where(row => row.OrganizationId == null || operational.Any(unit => unit.Id == row.OrganizationId))
            .SingleOrDefaultAsync(row => row.Id == accountId, cancellationToken);
        return account is not null && LoginCommandHandler.IsUsable(account) && LoginCommandHandler.SessionVersion(account) == version
            && (!account.MustChangePassword || account.TemporaryPasswordExpiresUtc > clock.GetUtcNow().UtcDateTime) ? account : null;
    }

    private async Task<IActionResult> GuardLogin(Guid accountId, Func<LoginAttemptGuard.Attempt, Task<IActionResult?>> operation, CancellationToken ct)
    {
        var result = await new LoginAttemptGuard(database, clock).RunAsync(LoginAttemptGuard.AccountKey(accountId), operation, ct);
        return result.RetryAfterSeconds(clock.GetUtcNow().UtcDateTime) is int seconds
            ? AuthLoginResponse.Locked(this, seconds) : result.Value!;
    }

    private ObjectResult RateLimited() => StatusCode(429, new { success = false, message = "Bạn đã thử nhiều lần. Vui lòng thử lại sau." });
    private BadRequestObjectResult InvalidLoginFactor() => BadRequest(new { success = false, message = AuthLoginResponse.InvalidCredentials });
    private BadRequestObjectResult ExpiredSetup() => BadRequest(new { success = false, code = "mfa_setup_expired", message = "Yêu cầu thiết lập đã hết hiệu lực. Hãy bắt đầu lại." });

    private sealed record PendingAuthenticator(Guid AccountId, Guid? SessionId, Guid SecurityVersion, string ProtectedSecret);
}

public sealed record AuthenticatorSetupRequest([StringLength(128)] string? CurrentPassword, [StringLength(32)] string? ActivationCode);
public sealed record AuthenticatorConfirmRequest([Required, StringLength(2048)] string Setup, [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
public sealed record AuthenticatorReauthenticateRequest([Required, StringLength(128)] string CurrentPassword, [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
public sealed record AuthenticatorRecoveryRequest([Required, StringLength(2048)] string Challenge, [Required, StringLength(32)] string RecoveryCode);
