using System;
using System.Threading.Tasks;
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
        try
        {
            var result = await _mediator.Send(new GetUnionMembersQuery
            {
                Search = search,
                ToCongDoanId = toCongDoanId,
                VaiTro = vaiTro,
                TrangThai = trangThai,
                Page = page,
                PageSize = pageSize
            });
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new GetUnionMemberDetailQuery(id));
            if (result == null)
            {
                return NotFound(new { success = false, message = "Không tìm thấy đoàn viên." });
            }
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUnionMemberCommand command)
    {
        try
        {
            var id = await _mediator.Send(command);
            return Ok(new { success = true, data = id });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
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
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnionMemberCommand command)
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
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
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
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteUnionMemberCommand(id));
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
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

    [HttpPost("{id}/transfer")]
    public async Task<IActionResult> Transfer(Guid id, [FromBody] TransferUnionMemberRequest request)
    {
        try
        {
            var command = new TransferUnionMemberCommand
            {
                DoanVienId = id,
                DenToCongDoanId = request.DenToCongDoanId,
                LyDo = request.LyDo,
                NgayHieuLuc = request.NgayHieuLuc,
                FileMinhChungUrl = request.FileMinhChungUrl
            };

            var result = await _mediator.Send(command);
            return Ok(new { success = true, data = result });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(403, new { success = false, message = ex.Message });
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
}

public class TransferUnionMemberRequest
{
    public Guid DenToCongDoanId { get; set; }
    public required string LyDo { get; set; }
    public DateTime NgayHieuLuc { get; set; }
    public string? FileMinhChungUrl { get; set; }
}

