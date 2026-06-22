using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Emulations.Commands;
using QLCD.Application.Features.Emulations.Queries.GetEmulations;

using QLCD.Application.Features.Emulations.Queries.GetEmulationDetail;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/emulations")]
[Authorize]
public class EmulationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmulationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    private string? GetUserRole() => User.FindFirst(ClaimTypes.Role)?.Value;

    private Guid? GetScopeOrgId()
    {
        var val = User.FindFirst("OrganizationId")?.Value;
        return Guid.TryParse(val, out Guid orgId) ? orgId : null;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] int? nam, [FromQuery] string? xepLoai)
    {
        try
        {
            var query = new GetEmulationsQuery
            {
                Search = search,
                Nam = nam,
                XepLoai = xepLoai,
                ScopeOrgId = GetScopeOrgId(),
                UserRole = GetUserRole()
            };
            var list = await _mediator.Send(query);
            return Ok(new { success = true, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var query = new GetEmulationDetailQuery { Id = id };
            var result = await _mediator.Send(query);
            if (result == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy thi đua." });
            }
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmulationCommand command)
    {
        try
        {
            var finalCommand = command with
            {
                ScopeOrgId = GetScopeOrgId(),
                UserRole = GetUserRole()
            };
            var id = await _mediator.Send(finalCommand);
            return Ok(new { success = true, data = id });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmulationCommand command)
    {
        try
        {
            var finalCommand = command with
            {
                Id = id,
                ScopeOrgId = GetScopeOrgId(),
                UserRole = GetUserRole()
            };
            var result = await _mediator.Send(finalCommand);
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteEmulationCommand
            {
                Id = id,
                ScopeOrgId = GetScopeOrgId(),
                UserRole = GetUserRole()
            });
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return Forbid(ex.Message);
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
}
