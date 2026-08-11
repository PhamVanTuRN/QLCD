using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;

namespace AttendanceManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class MasterDataController : ControllerBase
{
    private readonly IAttendanceDbContext _context;

    public MasterDataController(IAttendanceDbContext context)
    {
        _context = context;
    }

    [HttpGet("departments")]
    public async Task<IActionResult> GetDepartments()
    {
        var result = await _context.Departments
            .Select(x => new { x.Id, x.Code, x.Name })
            .ToListAsync();
        return Ok(new { Data = result });
    }

    [HttpGet("persons")]
    public async Task<IActionResult> GetPersons()
    {
        var result = await _context.Persons
            .Select(x => new { x.Id, x.Code, x.FullName, DepartmentId = x.DepartmentId })
            .ToListAsync();
        return Ok(new { Data = result });
    }

    [HttpGet("locations")]
    public async Task<IActionResult> GetLocations()
    {
        var result = await _context.Locations
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.Code, x.Name })
            .ToListAsync();
        return Ok(new { Data = result });
    }

    [HttpGet("devices")]
    public async Task<IActionResult> GetDevices()
    {
        var result = await _context.AttendanceDevices
            .Where(x => x.IsActive)
            .Select(x => new { x.Id, x.DeviceCode, x.DeviceName, x.LocationId })
            .ToListAsync();
        return Ok(new { Data = result });
    }
}
