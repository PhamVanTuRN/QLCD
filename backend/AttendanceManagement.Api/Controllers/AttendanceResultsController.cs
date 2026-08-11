using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using AttendanceManagement.Application.Features.AttendanceResults.Commands;
using AttendanceManagement.Application.Features.AttendanceResults.Queries;

namespace AttendanceManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AttendanceResultsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttendanceResultsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAttendanceResultsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetAttendanceResultDetailQuery { Id = id });
        return Ok(result);
    }

    [HttpPost("calculate/{eventId}")]
    public async Task<IActionResult> CalculateEventResults(Guid eventId)
    {
        await _mediator.Send(new CalculateEventResultsCommand { EventId = eventId });
        return Ok();
    }

    [HttpPut("{id}/override")]
    public async Task<IActionResult> OverrideResult(Guid id, ManualOverrideResultCommand command)
    {
        if (id != command.Id)
            return BadRequest("Id mismatch");

        await _mediator.Send(command);
        return NoContent();
    }
}
