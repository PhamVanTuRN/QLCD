using QLCD.Application.Common;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;

using Microsoft.AspNetCore.Authorization;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/union-units")]
[Authorize]
public class UnionUnitsController : ControllerBase
{
    private readonly IMediator _mediator;

    public UnionUnitsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Create([FromBody] CreateUnionUnitCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        var tree = await _mediator.Send(new GetUnionUnitsTreeQuery(), HttpContext.RequestAborted);
        return Ok(new { success = true, data = tree });
    }

    [HttpGet("inactive")]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Inactive([FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var rows = await _mediator.Send(new GetInactiveUnitsQuery(page, pageSize), HttpContext.RequestAborted);
        return Ok(new { success = true, data = rows.Take(pageSize), hasMore = rows.Count > pageSize });
    }

    [HttpPost("{id:guid}/restore")]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Restore(Guid id)
    {
        var result = await _mediator.Send(new RestoreUnionUnitCommand(id), HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {

        var stats = await _mediator.Send(new GetUnionStatsQuery(), HttpContext.RequestAborted);
        return Ok(new { success = true, data = stats });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnionUnitCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { success = false, message = "ID không trùng khớp." });
        }
        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteUnionUnitCommand(id), HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
