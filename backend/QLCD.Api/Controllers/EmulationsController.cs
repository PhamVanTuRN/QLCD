using QLCD.Application.Common;
using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Emulations.Commands;
using QLCD.Application.Features.Emulations.Queries.GetEmulations;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/emulations")]
[Authorize(Roles = SecurityRoles.Business)]
public class EmulationsController : ControllerBase
{
    private readonly IMediator _mediator;

    public EmulationsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] int? nam, [FromQuery] string? xepLoai, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetEmulationsQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            Nam = nam,
            XepLoai = xepLoai,
        };
        var list = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] int nam)
    {
        var summary = await _mediator.Send(new GetEmulationSummaryQuery(nam), HttpContext.RequestAborted);
        return Ok(new { success = true, data = summary });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEmulationCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateEmulationCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { success = false, message = "ID không trùng khớp." });
        }
        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = SecurityRoles.Central + "," + SecurityRoles.Department)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteEmulationCommand
        {
            Id = id,
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
