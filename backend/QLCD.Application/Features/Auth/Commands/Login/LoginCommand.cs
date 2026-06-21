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

    public LoginCommandHandler(IQLCDDbContext context)
    {
        _context = context;
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
        var key = Encoding.ASCII.GetBytes("Antigravity_QLCD_Super_Secure_Key_12891391398123");
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
