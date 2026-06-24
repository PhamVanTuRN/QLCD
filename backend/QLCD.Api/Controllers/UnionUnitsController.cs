using System;
using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;

using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Api.Controllers;

[ApiController]
[Route("api/v1/union-units")]
[Authorize]
public class UnionUnitsController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IQLCDDbContext _context;

    public UnionUnitsController(IMediator mediator, IQLCDDbContext context)
    {
        _mediator = mediator;
        _context = context;
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Create([FromBody] CreateUnionUnitCommand command)
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

    [HttpGet("tree")]
    public async Task<IActionResult> GetTree()
    {
        try
        {
            var tree = await _mediator.Send(new GetUnionUnitsTreeQuery());
            return Ok(new { success = true, data = tree });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(
        [FromQuery] Guid? maKhoi,
        [FromQuery] Guid? filterOrgId,
        [FromQuery] DateTime? fromDate,
        [FromQuery] DateTime? toDate,
        [FromQuery] int? month,
        [FromQuery] int? quarter,
        [FromQuery] int? year,
        [FromQuery] string? searchKeyword)
    {
        try
        {
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var orgIdVal = User.FindFirst("OrganizationId")?.Value;
            Guid? scopeOrgId = Guid.TryParse(orgIdVal, out Guid id) ? id : null;

            var stats = await _mediator.Send(new GetUnionStatsQuery
            {
                ScopeOrgId = scopeOrgId,
                UserRole = userRole,
                MaKhoi = maKhoi,
                FilterOrgId = filterOrgId,
                FromDate = fromDate,
                ToDate = toDate,
                Month = month,
                Quarter = quarter,
                Year = year,
                SearchKeyword = searchKeyword
            });
            return Ok(new { success = true, data = stats });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpGet("khoi-chuyen-mon")]
    public async Task<IActionResult> GetKhoiChuyenMon()
    {
        try
        {
            var rawList = await _context.KhoiChuyenMons.ToListAsync();
            var sortedList = rawList
                .OrderBy(k => k.TenKhoi.Contains("Cơ quan") ? 1 :
                              k.TenKhoi.Contains("Nội") ? 2 :
                              k.TenKhoi.Contains("Ngoại") ? 3 :
                              k.TenKhoi.Contains("Cận lâm sàng") ? 4 : 5)
                .Select(k => new { id = k.Id, tenKhoi = k.TenKhoi })
                .ToList();
            return Ok(new { success = true, data = sortedList });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống: " + ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUnionUnitCommand command)
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
    [Authorize(Roles = "ADMIN,CDCS")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var result = await _mediator.Send(new DeleteUnionUnitCommand(id));
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
}
