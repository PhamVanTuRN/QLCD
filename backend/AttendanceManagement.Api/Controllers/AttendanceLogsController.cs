using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using AttendanceManagement.Application.Features.AttendanceLogs.Commands;
using AttendanceManagement.Application.Features.AttendanceLogs.Queries;

namespace AttendanceManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AttendanceLogsController : ControllerBase
{
    private readonly IMediator _mediator;

    public AttendanceLogsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] GetAttendanceLogsQuery query)
    {
        var result = await _mediator.Send(query);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetAttendanceLogDetailQuery { Id = id });
        return Ok(result);
    }

    [HttpPost("receive")]
    public async Task<IActionResult> Receive(ReceiveAttendanceLogCommand command)
    {
        var id = await _mediator.Send(command);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }
}
