using System;
using System.Security.Claims;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Initiatives.Commands;
using QLCD.Application.Features.Initiatives.Queries.GetInitiatives;

using QLCD.Application.Features.Initiatives.Queries.GetInitiativeDetail;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/initiatives")]
[Authorize]
public class InitiativesController : ControllerBase
{
    private readonly IMediator _mediator;

    public InitiativesController(IMediator mediator)
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
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? capDeTai, [FromQuery] int? trangThai)
    {
        try
        {
            var query = new GetInitiativesQuery
            {
                Search = search,
                CapDeTai = capDeTai,
                TrangThai = trangThai,
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
            var query = new GetInitiativeDetailQuery { Id = id };
            var result = await _mediator.Send(query);
            if (result == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy đề tài sáng kiến." });
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
    public async Task<IActionResult> Create([FromBody] CreateInitiativeCommand command)
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
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInitiativeCommand command)
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
            var result = await _mediator.Send(new DeleteInitiativeCommand
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
