using QLCD.Application.Common;
using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using QLCD.Application.Features.Catalogs.Commands.CreateCatalog;
using QLCD.Application.Features.Catalogs.Commands.UpdateCatalog;
using QLCD.Application.Features.Catalogs.Commands.DeleteCatalog;
using QLCD.Application.Features.Catalogs.Queries.GetCatalogs;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/catalogs")]
[Authorize]
public class CatalogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public CatalogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? loai, [FromQuery] string? search, [FromQuery] bool? activeOnly, [FromQuery] int page = 1, [FromQuery] int pageSize = PageBounds.DefaultSize)
    {
        var query = new GetCatalogsQuery
        {
            Page = page,
            PageSize = pageSize,
            Loai = loai,
            Search = search,
            ActiveOnly = activeOnly
        };
        var list = await _mediator.Send(query, HttpContext.RequestAborted);
        return Ok(new { success = true, data = list.Take(pageSize), hasMore = list.Count > pageSize });
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create([FromBody] CreateCatalogCommand command)
    {
        var id = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = id });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCatalogCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { success = false, message = "ID không trùng khớp." });
        }
        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteCatalogCommand(id), HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}
