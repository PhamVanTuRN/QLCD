using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Shared.Security;
using Microsoft.AspNetCore.Authorization;

namespace AttendanceManagement.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAttendanceDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(IAttendanceDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _context.UserAccounts
            .FirstOrDefaultAsync(u => u.Username == request.Username);

        if (user == null || !user.Status)
            return Unauthorized(new { Message = "Tài khoản không tồn tại hoặc đã bị khóa" });

        var isPasswordValid = PasswordHasher.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
            return Unauthorized(new { Message = "Sai mật khẩu" });

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_configuration["JwtSettings:Secret"]);
        
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("FullName", user.FullName),
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return Ok(new
        {
            Data = new
            {
                Token = tokenHandler.WriteToken(token),
                Id = user.Id,
                HoTen = user.FullName,
                VaiTro = user.Role,
                PhamVi = user.Role
            }
        });
    }
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
