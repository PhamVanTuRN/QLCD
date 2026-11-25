using QLCD.Application.Common;
using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Initiatives.Commands;
using QLCD.Application.Features.Initiatives.Queries.GetInitiatives;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/initiatives")]
[Authorize(Roles = SecurityRoles.Business)]
public class InitiativesController : ControllerBase
{
    private readonly IMediator _mediator;

    public InitiativesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? capDeTai, [FromQuery] int? trangThai, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetInitiativesQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            CapDeTai = capDeTai,
            TrangThai = trangThai,
        };
        var list = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInitiativeCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInitiativeCommand command)
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
        var result = await _mediator.Send(new DeleteInitiativeCommand
        {
            Id = id,
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
