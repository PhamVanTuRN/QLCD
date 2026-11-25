using QLCD.Application.Common;
using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Activities.Commands;
using QLCD.Application.Features.Activities.Queries.GetActivities;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/activities")]
[Authorize]
public class ActivitiesController : ControllerBase
{
    private readonly IMediator _mediator;

    public ActivitiesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? loaiHoatDong, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetActivitiesQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            LoaiHoatDong = loaiHoatDong,
            FromDate = fromDate,
            ToDate = toDate,
        };
        var list = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize });
    }

    [HttpPost]
    [Authorize(Roles = SecurityRoles.Business)]
    public async Task<IActionResult> Create([FromBody] CreateActivityCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = SecurityRoles.Business)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateActivityCommand command)
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
        var result = await _mediator.Send(new DeleteActivityCommand
        {
            Id = id,
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
