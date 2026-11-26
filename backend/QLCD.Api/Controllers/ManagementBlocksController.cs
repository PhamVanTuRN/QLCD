using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Common;
using QLCD.Application.Features.ManagementBlocks;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/management-blocks")]
[Authorize]
public sealed class ManagementBlocksController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize,
        [FromQuery] bool activeOnly = false, [FromQuery] string? search = null)
    {
        var rows = await mediator.Send(new GetManagementBlocks(page, pageSize, activeOnly, search), HttpContext.RequestAborted);
        return Ok(new { success = true, data = rows.Take(pageSize), hasMore = rows.Count > pageSize });
    }
    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create(SaveManagementBlock request)
    {
        if (request.Id is not null) return BadRequest(new { message = "Tạo mới không nhận ID có sẵn." });
        var id = await mediator.Send(request, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(Guid id, SaveManagementBlock request)
    {
        if (request.Id != id) return BadRequest(new { message = "ID không trùng khớp." });
        var saved = await mediator.Send(request, HttpContext.RequestAborted);
        return Ok(new { success = true, data = saved });
    }
    // No DELETE endpoint: stopping a block never removes its rows or linked organizations.
}
