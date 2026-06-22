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
    public async Task<IActionResult> Get([FromQuery] string? loai, [FromQuery] string? search, [FromQuery] bool? activeOnly)
    {
        try
        {
            var query = new GetCatalogsQuery
            {
                Loai = loai,
                Search = search,
                ActiveOnly = activeOnly
            };
            var list = await _mediator.Send(query);
            return Ok(new { success = true, data = list });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create([FromBody] CreateCatalogCommand command)
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

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCatalogCommand command)
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
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteCatalogCommand(id));
            return Ok(new { success = true, data = result });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }
}
