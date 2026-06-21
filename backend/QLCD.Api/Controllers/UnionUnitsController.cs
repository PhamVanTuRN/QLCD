using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/union-units")]
public class UnionUnitsController : ControllerBase
{
    private readonly IMediator _mediator;

    public UnionUnitsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnionUnitCommand command)
    {
        try
        {
            var id = await _mediator.Send(command);
            return Ok(new { success = true, data = id });
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

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        try
        {
            var tree = await _mediator.Send(new GetUnionUnitsTreeQuery());
            return Ok(new { success = true, data = tree });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        try
        {
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var orgIdVal = User.FindFirst("OrganizationId")?.Value;
            Guid? scopeOrgId = Guid.TryParse(orgIdVal, out Guid id) ? id : null;

            var stats = await _mediator.Send(new GetUnionStatsQuery
            {
                ScopeOrgId = scopeOrgId,
                UserRole = userRole
            });
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnionUnitCommand command)
    {
        try
        {
            if (id != command.Id)
            {
                return BadRequest(new { success = false, message = "ID không trùng khớp." });
            }
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteUnionUnitCommand(id));
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
}
