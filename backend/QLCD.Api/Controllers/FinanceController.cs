using QLCD.Application.Common;
using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.Finance.Commands;
using QLCD.Application.Features.Finance.Queries.GetFinance;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/finance")]
[Authorize(Roles = SecurityRoles.Finance + "," + SecurityRoles.Team)]
public class FinanceController : ControllerBase
{
    private readonly IMediator _mediator;

    public FinanceController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? search, [FromQuery] string? loaiGiaoDich, [FromQuery] string? thangNam, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetFinanceQuery
        {
            Page = page,
            PageSize = pageSize,
            Search = search,
            LoaiGiaoDich = loaiGiaoDich,
            ThangNam = thangNam,
        };
        var result = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result.Items.Take(pageSize), hasMore = result.Items.Count > pageSize, result.Totals });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateFinanceCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateFinanceCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { success = false, message = "ID không trùng khớp." });
        }
        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = SecurityRoles.Finance)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteFinanceCommand
        {
            Id = id,
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
