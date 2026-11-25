using QLCD.Application.Common;
using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Welfare.Commands;
using QLCD.Application.Features.Welfare.Queries.GetWelfare;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/welfare")]
[Authorize(Roles = SecurityRoles.Business)]
public class WelfareController : ControllerBase
{
    private readonly IMediator _mediator;

    public WelfareController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? loaiPhucLoi, [FromQuery] int? trangThai, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetWelfareQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            LoaiPhucLoi = loaiPhucLoi,
            TrangThai = trangThai,
        };
        var list = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWelfareCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWelfareCommand command)
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
        var result = await _mediator.Send(new DeleteWelfareCommand
        {
            Id = id,
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
