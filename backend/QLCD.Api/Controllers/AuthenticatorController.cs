using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using QLCD.Api.Security;
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
    LoginThrottle throttle, TimeProvider clock) : ControllerBase
{
    private const string SetupPurpose = "QLCD.AuthenticatorSetup.v2";
    private const string RecoveryPurpose = "QLCD.AuthenticatorRecovery.v1";
    private const string Issuer = "Cong doan so 108";
    private AuthenticatedSession Session => HttpContext.Features.Get<AuthenticatedSession>()!;

    [HttpGet]
    public async Task<IActionResult> Status(CancellationToken cancellationToken)
    {
        var account = await LoadCurrent(cancellationToken);
        return account is null ? Unauthorized() : Ok(new { success = true, data = SessionProfile.From(account) });
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup(AuthenticatorSetupRequest request, CancellationToken cancellationToken)
    {
        if (!throttle.TryAcquireAuthenticatorChange(Session.Profile.Id)) return RateLimited();
        var account = await LoadCurrent(cancellationToken);
        if (account is null) return Unauthorized();
        if (account.ProtectedMfaSecret is not null) return Conflict();
        if (!PasswordHasher.Verify(request.CurrentPassword, account.PasswordHash)
            || !(account.ActivationCodeExpiresUtc > clock.GetUtcNow().UtcDateTime)
            || !AccountCredentials.MatchesHash(request.ActivationCode, account.ActivationCodeHash))
            return BadRequest(new { success = false, message = "Mật khẩu hoặc mã kích hoạt không hợp lệ." });

        return CreateSetup(account, SetupPurpose, Session.Id);
    }

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(AuthenticatorConfirmRequest request, CancellationToken cancellationToken)
    {
        if (!throttle.TryAcquireAuthenticatorChange(Session.Profile.Id)) return RateLimited();
        var pending = protection.Read<PendingAuthenticator>(SetupPurpose, request.Setup);
        var account = await LoadCurrent(cancellationToken);
        if (account is null) return Unauthorized();
        if (account.ProtectedMfaSecret is not null || pending?.SessionId != Session.Id
            || account.ActivationCodeHash is null || !(account.ActivationCodeExpiresUtc > clock.GetUtcNow().UtcDateTime))
            return ExpiredSetup();
        return await ConfirmSetup(account, pending!, request.Code, Session.Id, cancellationToken);
    }

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    [HttpPost("recovery")]
    public async Task<IActionResult> Recover(AuthenticatorRecoveryRequest request, CancellationToken cancellationToken)
    {
        var challenge = protection.Read<AuthenticatorLoginChallenge>(AuthenticatorTickets.LoginPurpose, request.Challenge);
        if (challenge is null) return ExpiredSetup();
        if (!throttle.TryAcquireSecondFactor(challenge.Proof.AccountId)) return RateLimited();
        var account = await FindUsable(challenge.Proof.AccountId, challenge.Proof.SecurityVersion, cancellationToken);
        if (account?.ProtectedMfaSecret is null || !AccountCredentials.MatchesRecoveryCode(account, request.RecoveryCode))
            return BadRequest(new { success = false, message = "Mã khôi phục không hợp lệ hoặc đã được sử dụng." });
        return CreateSetup(account, RecoveryPurpose, null);
    }

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    [HttpPost("recovery/confirm")]
    public async Task<IActionResult> ConfirmRecovery(AuthenticatorConfirmRequest request, CancellationToken cancellationToken)
    {
        var pending = protection.Read<PendingAuthenticator>(RecoveryPurpose, request.Setup);
        if (pending is null) return ExpiredSetup();
        if (!throttle.TryAcquireAuthenticatorChange(pending.AccountId)) return RateLimited();
        var account = await FindUsable(pending.AccountId, pending.SecurityVersion, cancellationToken);
        if (account?.ProtectedMfaSecret is null) return ExpiredSetup();
        return await ConfirmSetup(account, pending, request.Code, null, cancellationToken);
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

    private IActionResult CreateSetup(TaiKhoan account, string purpose, Guid? sessionId)
    {
        var key = TotpVerifier.GenerateKey();
        var setup = protection.Protect(purpose,
            new PendingAuthenticator(account.Id, sessionId, LoginCommandHandler.SessionVersion(account), totp.Protect(account.Id, key)), TimeSpan.FromMinutes(10));
        var issuer = Uri.EscapeDataString(Issuer);
        var label = Uri.EscapeDataString(account.Username);
        var uri = $"otpauth://totp/{issuer}:{label}?secret={key}&issuer={issuer}&algorithm=SHA1&digits=6&period=30";
        var png = PngByteQRCodeHelper.GetQRCode(uri, QRCodeGenerator.ECCLevel.M, 5);
        return Ok(new { success = true, data = new { setup, key, qrImage = $"data:image/png;base64,{Convert.ToBase64String(png)}" } });
    }

    private async Task<IActionResult> ConfirmSetup(TaiKhoan account, PendingAuthenticator pending, string code, Guid? sessionId, CancellationToken cancellationToken)
    {
        if (pending.AccountId != account.Id || pending.SecurityVersion != LoginCommandHandler.SessionVersion(account))
            return ExpiredSetup();
        if (!totp.TryVerifySecret(account.Id, pending.ProtectedSecret, code, null, out var step))
            return BadRequest(new { success = false, message = "Mã Authenticator không đúng hoặc đã hết hạn." });

        account.ProtectedMfaSecret = pending.ProtectedSecret;
        account.ActivationCodeHash = null;
        account.ActivationCodeExpiresUtc = null;
        account.LastMfaStep = step;
        var codes = AccountCredentials.RotateRecoveryCodes(account);
        // An onboarding session remains limited to password change. Every other case requires a new sign-in.
        await RotateStamp(account, account.MustChangePassword ? sessionId : null, cancellationToken);
        database.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id,
            sessionId.HasValue ? "MFA_ENROLL" : "MFA_RECOVERY", HttpContext.TraceIdentifier));
        await database.SaveChangesAsync(cancellationToken);
        return Ok(new { success = true, data = new { codes } });
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
        var account = await database.TaiKhoans.Include(row => row.Organization)
            .SingleOrDefaultAsync(row => row.Id == accountId, cancellationToken);
        return account is not null && LoginCommandHandler.IsUsable(account) && LoginCommandHandler.SessionVersion(account) == version
            && (!account.MustChangePassword || account.TemporaryPasswordExpiresUtc > clock.GetUtcNow().UtcDateTime) ? account : null;
    }

    private ObjectResult RateLimited() => StatusCode(429, new { success = false, message = "Bạn đã thử nhiều lần. Vui lòng thử lại sau." });
    private BadRequestObjectResult ExpiredSetup() => BadRequest(new { success = false, code = "mfa_setup_expired", message = "Yêu cầu thiết lập đã hết hiệu lực. Hãy bắt đầu lại." });

    private sealed record PendingAuthenticator(Guid AccountId, Guid? SessionId, Guid SecurityVersion, string ProtectedSecret);
}

public sealed record AuthenticatorSetupRequest([Required, StringLength(128)] string CurrentPassword, [StringLength(32)] string? ActivationCode);
public sealed record AuthenticatorConfirmRequest([Required, StringLength(2048)] string Setup, [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
public sealed record AuthenticatorReauthenticateRequest([Required, StringLength(128)] string CurrentPassword, [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
public sealed record AuthenticatorRecoveryRequest([Required, StringLength(2048)] string Challenge, [Required, StringLength(32)] string RecoveryCode);
