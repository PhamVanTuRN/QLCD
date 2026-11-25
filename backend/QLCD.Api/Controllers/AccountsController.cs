using MediatR;
using QLCD.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Accounts.Commands;
using QLCD.Application.Features.Accounts.Queries.GetAccounts;
using QLCD.Domain.Security;
using System.ComponentModel.DataAnnotations;
using QLCD.Api.Security;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/accounts")]
[Authorize(Roles = SecurityRoles.Admin)]
public sealed class AccountsController(IMediator mediator, LoginThrottle throttle, IAuthorizationService authorization) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var list = await mediator.Send(new GetAccountsQuery { Page = page, PageSize = pageSize, Search = search }, HttpContext.RequestAborted);
        var canResetCredentials = (await authorization.AuthorizeAsync(User, CredentialResetPermission.Policy)).Succeeded;
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize, canResetCredentials });
    }

    [HttpPost("{id:guid}/toggle")]
    public async Task<IActionResult> ToggleStatus(Guid id, CancellationToken cancellationToken)
    {
        var active = await mediator.Send(new ToggleAccount(id), cancellationToken);
        return Ok(new { success = true, data = active });
    }

    [HttpPost("{id:guid}/activate")]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> Activate(Guid id, ActivateAccountRequest request, CancellationToken cancellationToken)
    {
        if (!request.IdentityVerified) return BadRequest(new { success = false, message = "Hãy xác minh danh tính chủ tài khoản trước khi tiếp tục." });
        var activationCode = await mediator.Send(new IssueAccountActivation(id, request.IdentityVerified, HttpContext.TraceIdentifier), cancellationToken);
        return Ok(new { success = true, data = new { activationCode } });
    }

    [HttpPost("{id:guid}/reset-password")]
    [Authorize(Policy = CredentialResetPermission.Policy)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> ResetPassword(Guid id, ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var session = HttpContext.Features.Get<AuthenticatedSession>()!;
        if (!request.Confirmed) return BadRequest(new { success = false, message = "Hãy xác nhận đặt lại mật khẩu." });
        if (!AllowResetAttempt(session)) return RateLimited();
        await mediator.Send(new ResetAccountPassword(id, request.CurrentPassword, request.Code, session.SecurityVersion, HttpContext.TraceIdentifier), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/reset-2fa")]
    [Authorize(Policy = CredentialResetPermission.Policy)]
    [RequestSizeLimit(4096)]
    public async Task<IActionResult> ResetAuthenticator(Guid id, ResetAccountAuthenticationRequest request, CancellationToken cancellationToken)
    {
        var session = HttpContext.Features.Get<AuthenticatedSession>()!;
        if (!request.IdentityVerified) return BadRequest(new { success = false, message = "Hãy xác minh danh tính chủ tài khoản trước khi tiếp tục." });
        if (!AllowResetAttempt(session)) return RateLimited();
        var activationCode = await mediator.Send(new ResetAccountAuthenticator(id, request.CurrentPassword, request.Code,
            session.SecurityVersion, HttpContext.TraceIdentifier), cancellationToken);
        return Ok(new { success = true, data = new { activationCode } });
    }

    private bool AllowResetAttempt(AuthenticatedSession session) => throttle.TryAcquireAuthenticatorChange(session.Profile.Id, "admin-recovery");
    private ObjectResult RateLimited() => StatusCode(429, new { success = false, message = "Bạn đã thử nhiều lần. Vui lòng thử lại sau." });
}

public sealed record ActivateAccountRequest(bool IdentityVerified);
public sealed record ResetPasswordRequest(bool Confirmed,
    [Required, StringLength(128)] string CurrentPassword,
    [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
public sealed record ResetAccountAuthenticationRequest(bool IdentityVerified,
    [Required, StringLength(128)] string CurrentPassword,
    [Required, RegularExpression(@"\A[0-9]{6}\z")] string Code);
