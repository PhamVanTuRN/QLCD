using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Accounts.Queries.GetAccounts;
using QLCD.Shared.Security;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/accounts")]
public class AccountsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IQLCDDbContext _context;

    public AccountsController(IMediator mediator, IQLCDDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var list = await _mediator.Send(new GetAccountsQuery());
            return Ok(new { success = true, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPost("{id}/toggle")]
    public async Task<IActionResult> ToggleStatus(Guid id)
    {
        try
        {
            var account = await _context.TaiKhoans.FirstOrDefaultAsync(a => a.Id == id);
            if (account == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy tài khoản." });
            }

            account.TrangThai = !account.TrangThai;
            await _context.SaveChangesAsync(CancellationToken.None);

            return Ok(new { success = true, data = account.TrangThai });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPost("{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(Guid id, [FromBody] ResetPasswordRequest request)
    {
        try
        {
            var account = await _context.TaiKhoans.FirstOrDefaultAsync(a => a.Id == id);
            if (account == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy tài khoản." });
            }

            if (string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { success = false, message = "Mật khẩu không được để trống." });
            }

            account.PasswordHash = PasswordHasher.Hash(request.NewPassword);
            account.PasswordRaw = request.NewPassword;
            await _context.SaveChangesAsync(CancellationToken.None);

            return Ok(new { success = true, message = "Đặt lại mật khẩu thành công." });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }
}

public class ResetPasswordRequest
{
    public required string NewPassword { get; set; }
}
