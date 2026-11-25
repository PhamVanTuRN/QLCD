using System.ComponentModel.DataAnnotations;
using MediatR;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using QLCD.Api.Security;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Shared.Security;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public sealed class AuthController(
    IMediator mediator,
    IQLCDDbContext database,
    IWebHostEnvironment environment,
    LoginThrottle throttle,
    IDataProtectionProvider protection,
    TotpVerifier totp,
    ILogger<AuthController> logger) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("csrf")]
    public IActionResult Csrf([FromServices] IAntiforgery antiforgery) =>
        Ok(new { token = antiforgery.GetAndStoreTokens(HttpContext).RequestToken });

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.Policy)]
    [RequestSizeLimit(4096)]
    [HttpPost("login")]
    public Task<IActionResult> Login(LoginCommand command, CancellationToken cancellationToken) =>
        SignIn(command, cancellationToken);

    [AllowAnonymous]
    [EnableRateLimiting(LoginThrottle.FactorPolicy)]
    [RequestSizeLimit(4096)]
    [HttpPost("login/authenticator")]
    public async Task<IActionResult> AuthenticatorLogin(AuthenticatorLoginRequest request, CancellationToken cancellationToken)
    {
        var challenge = protection.Read<AuthenticatorLoginChallenge>(AuthenticatorTickets.LoginPurpose, request.Challenge);
        if (challenge is null)
            return Unauthorized(new { success = false, code = "mfa_challenge_expired", message = "Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại." });

        return await SignIn(new LoginCommand(challenge.Username, "", request.Code) { VerifiedPassword = challenge.Proof }, cancellationToken);
    }

    private async Task<IActionResult> SignIn(LoginCommand command, CancellationToken cancellationToken)
    {
        if (!(command.VerifiedPassword is { } proofToCheck
            ? throttle.TryAcquireSecondFactor(proofToCheck.AccountId)
            : throttle.TryAcquire(command.Username)))
        {
            await ApiErrors.WriteAsync(HttpContext, 429, "Vui lòng thử đăng nhập lại sau.", cancellationToken);
            return new EmptyResult();
        }

        var result = await mediator.Send(command, cancellationToken);
        if (result?.Proof is { } proof)
        {
            var challenge = protection.Protect(AuthenticatorTickets.LoginPurpose,
                new AuthenticatorLoginChallenge(result.Profile.Username, proof), TimeSpan.FromMinutes(3));
            return Accepted(new { success = true, data = new { challenge } });
        }
        logger.LogInformation("Account sign-in {Succeeded} actor {AccountId} trace {Trace}",
            result is not null, result?.Profile.Id, HttpContext.TraceIdentifier);
        if (result is null)
            return Unauthorized(new { success = false, message = "Thông tin đăng nhập hoặc mã xác thực không hợp lệ." });

        Response.Cookies.Append(SessionAuthenticationHandler.CookieName(environment), result.SessionToken!,
            SessionCookie(result.ExpiresAtUtc));
        return Ok(new { success = true, data = result.Profile });
    }

    [Authorize(Policy = "Session")]
    [HttpGet("session")]
    public IActionResult Session() =>
        Ok(new { success = true, data = HttpContext.Features.Get<AuthenticatedSession>()!.Profile });

    [Authorize(Policy = "Session")]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        var id = HttpContext.Features.Get<AuthenticatedSession>()!.Id;
        var session = await database.AuthSessions.FindAsync([id], cancellationToken);
        if (session is not null)
        {
            database.AuthSessions.Remove(session);
            try
            {
                await database.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateConcurrencyException)
            {
                // A concurrent logout already revoked the session.
            }
        }
        ClearCookie();
        return NoContent();
    }

    [Authorize(Policy = "Session")]
    [RequestSizeLimit(4096)]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var session = HttpContext.Features.Get<AuthenticatedSession>()!;
        if (!throttle.TryAcquireAuthenticatorChange(session.Profile.Id, "password"))
            return StatusCode(429, new { success = false, message = "Bạn đã thử nhiều lần. Vui lòng thử lại sau." });
        var account = await database.TaiKhoans.FindAsync([session.Profile.Id], cancellationToken);
        if (account is null || LoginCommandHandler.SessionVersion(account) != session.SecurityVersion)
            return Unauthorized();
        if (account.ProtectedMfaSecret is null) return Forbid();
        if (!PasswordHasher.IsAcceptable(request.NewPassword) || request.NewPassword == request.CurrentPassword
            || request.NewPassword != request.ConfirmPassword)
            return BadRequest(new { success = false, message = "Mật khẩu mới cần 8–128 ký tự, có chữ hoa, chữ thường, chữ số và ký tự đặc biệt. Mật khẩu phải khớp xác nhận và khác mật khẩu hiện tại hoặc mặc định." });
        if (!PasswordHasher.Verify(request.CurrentPassword, account.PasswordHash) || !totp.TryVerify(account, request.Code, out var step))
            return BadRequest(new { success = false, message = "Mật khẩu hiện tại hoặc mã Authenticator không hợp lệ." });

        account.PasswordHash = PasswordHasher.Hash(request.NewPassword);
        account.LastMfaStep = step;
        account.SecurityVersion = Guid.NewGuid();
        account.MustChangePassword = false;
        account.TemporaryPasswordExpiresUtc = null;
        database.AuditLogs.Add(AccountCredentials.Event(account.Id, account.Id, "PASSWORD_CHANGE", HttpContext.TraceIdentifier));
        await database.SaveChangesAsync(cancellationToken);
        ClearCookie();
        return NoContent();
    }

    private void ClearCookie() => Response.Cookies.Delete(SessionAuthenticationHandler.CookieName(environment), SessionCookie());

    private CookieOptions SessionCookie(DateTime? expiration = null) => new()
    {
        Secure = !environment.IsDevelopment() && !environment.IsEnvironment("Testing"),
        HttpOnly = true,
        SameSite = SameSiteMode.Strict,
        Path = "/",
        IsEssential = true,
        Expires = expiration,
    };

}

public sealed record ChangePasswordRequest(
    [Required, StringLength(128)] string CurrentPassword,
    [Required, StringLength(128)] string NewPassword,
    [Required, StringLength(128)] string ConfirmPassword,
    [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);

public sealed record AuthenticatorLoginRequest(
    [Required, StringLength(2048)] string Challenge,
    [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
