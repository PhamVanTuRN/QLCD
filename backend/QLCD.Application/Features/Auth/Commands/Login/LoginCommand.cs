using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QLCD.Application.Common.Interfaces;
using QLCD.Shared.Security;
using Microsoft.Extensions.Configuration;

namespace QLCD.Application.Features.Auth.Commands.Login;

public record LoginCommand : IRequest<LoginResponseDto>
{
    public required string Username { get; init; }
    public required string Password { get; init; }
}

public class LoginResponseDto
{
    public required string Token { get; set; }
    public required string Username { get; set; }
    public required string HoTen { get; set; }
    public required string VaiTro { get; set; }
    public Guid? OrganizationId { get; set; }
    public string? DonViTen { get; set; }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponseDto>
{
    private readonly IQLCDDbContext _context;
    private readonly IConfiguration _configuration;

    public LoginCommandHandler(IQLCDDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var user = await _context.TaiKhoans
            .Include(t => t.Organization)
            .FirstOrDefaultAsync(u => u.Username == request.Username && u.TrangThai, cancellationToken);

        if (user == null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new ArgumentException("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        // Generate JWT Token
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSecret = _configuration["JwtSettings:Secret"];
        if (string.IsNullOrEmpty(jwtSecret) || jwtSecret == "YOUR_JWT_SECRET_KEY_MINIMUM_32_CHARACTERS")
        {
            throw new InvalidOperationException("JWT Secret key is not properly configured in QLCD.Application.");
        }
        var key = Encoding.ASCII.GetBytes(jwtSecret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.VaiTro),
                new Claim("OrganizationId", user.OrganizationId?.ToString() ?? string.Empty)
            }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        return new LoginResponseDto
        {
            Token = tokenString,
            Username = user.Username,
            HoTen = user.HoTen,
            VaiTro = user.VaiTro,
            OrganizationId = user.OrganizationId,
            DonViTen = user.Organization?.TenDonVi
        };
    }
}
