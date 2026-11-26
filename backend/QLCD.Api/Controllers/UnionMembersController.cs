using QLCD.Domain.Security;
using System;
using System.Threading.Tasks;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;
using QLCD.Application.Features.UnionMembers.Commands.UpdateUnionMember;
using QLCD.Application.Features.UnionMembers.Commands.DeleteUnionMember;
using QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;
using QLCD.Application.Features.UnionMembers.Queries.GetUnionMembers;
using QLCD.Application.Features.UnionMembers.Queries.GetUnionMemberDetail;
using QLCD.Domain.Enums;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/union-members")]
[Authorize]
public class UnionMembersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UnionMembersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search,
        [FromQuery] Guid? toCongDoanId,
        [FromQuery] VaiTroCongDoan? vaiTro,
        [FromQuery] TrangThaiDoanVien? trangThai,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var result = await _mediator.Send(new GetUnionMembersQuery
        {
            Search = search,
            ToCongDoanId = toCongDoanId,
            VaiTro = vaiTro,
            TrangThai = trangThai,
            Page = page,
            PageSize = pageSize
        }, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _mediator.Send(new GetUnionMemberDetailQuery(id, HttpContext.TraceIdentifier), HttpContext.RequestAborted);
        if (result == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy đoàn viên." });
        }
        return Ok(new { success = true, data = result });
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnionMemberCommand command)
    {
        try
        {
            var id = await _mediator.Send(command, HttpContext.RequestAborted);
            return Ok(new { success = true, data = id });
        }
        catch (ValidationException error)
        {
            // The intake validator supplies fixed messages and never echoes submitted values.
            var message = error.Errors.Select(failure => failure.ErrorMessage)
                .FirstOrDefault(message => message != "Invalid request value.")
                ?? "Dữ liệu hồ sơ đoàn viên chưa hợp lệ.";
            return BadRequest(new { success = false, message });
        }
        catch (DuplicateMemberException error)
        {
            return Conflict(new { success = false, message = error.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnionMemberCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(new { success = false, message = "ID không trùng khớp." });
        }
        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = SecurityRoles.UnitManagers)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _mediator.Send(new DeleteUnionMemberCommand(id), HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }

    [HttpPost("{id}/transfer")]
    [Authorize(Roles = SecurityRoles.TransferManagers)]
    public async Task<IActionResult> Transfer(Guid id, [FromBody] TransferUnionMemberRequest request)
    {
        var command = new TransferUnionMemberCommand
        {
            DoanVienId = id,
            DenToCongDoanId = request.DenToCongDoanId,
            LyDo = request.LyDo,
            NgayHieuLuc = request.NgayHieuLuc,
            FileMinhChungUrl = request.FileMinhChungUrl
        };

        var result = await _mediator.Send(command, HttpContext.RequestAborted);
        return Ok(new { success = true, data = result });
    }
}

public class TransferUnionMemberRequest
{
    public Guid DenToCongDoanId { get; set; }
    public required string LyDo { get; set; }
    public DateTime NgayHieuLuc { get; set; }
    public string? FileMinhChungUrl { get; set; }
}

