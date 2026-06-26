using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Auth.Commands.Login;
using QLCD.Shared.Security;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IQLCDDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public AuthController(IMediator mediator, IQLCDDbContext context, ICurrentUserService currentUserService)
    {
        _mediator = mediator;
        _context = context;
        _currentUserService = currentUserService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        try
        {
            var result = await _mediator.Send(command);
            return Ok(new { success = true, data = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        try
        {
            var userId = _currentUserService.UserId;
            if (userId == null)
            {
                return Unauthorized(new { success = false, message = "Không xác định được tài khoản." });
            }

            var account = await _context.TaiKhoans.FirstOrDefaultAsync(a => a.Id == userId);
            if (account == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy tài khoản." });
            }

            if (!PasswordHasher.Verify(request.OldPassword, account.PasswordHash))
            {
                return BadRequest(new { success = false, message = "Mật khẩu cũ không chính xác." });
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
            {
                return BadRequest(new { success = false, message = "Mật khẩu mới phải từ 6 ký tự trở lên." });
            }

            account.PasswordHash = PasswordHasher.Hash(request.NewPassword);
            account.PasswordRaw = null; // Clear raw password since user changed it themselves
            await _context.SaveChangesAsync(CancellationToken.None);

            return Ok(new { success = true, message = "Đổi mật khẩu thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }
}

public class ChangePasswordRequest
{
    public required string OldPassword { get; set; }
    public required string NewPassword { get; set; }
}
