using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var val = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                      ?? User?.FindFirst("sub")?.Value
                      ?? User?.FindFirst("id")?.Value;
            return Guid.TryParse(val, out Guid id) ? id : null;
        }
    }

    public string? Username => User?.FindFirst(ClaimTypes.Name)?.Value
                               ?? User?.FindFirst("unique_name")?.Value
                               ?? User?.FindFirst("name")?.Value;

    public string? Role => User?.FindFirst(ClaimTypes.Role)?.Value
                           ?? User?.FindFirst("role")?.Value;

    public Guid? OrganizationId
    {
        get
        {
            var val = User?.FindFirst("OrganizationId")?.Value
                      ?? User?.FindFirst("organizationId")?.Value;
            return Guid.TryParse(val, out Guid id) ? id : null;
        }
    }

    public bool IsAdmin => string.Equals(Role, "ADMIN", StringComparison.OrdinalIgnoreCase);
    public bool IsCdcs => string.Equals(Role, "CDCS", StringComparison.OrdinalIgnoreCase);
    public bool IsCdbp => string.Equals(Role, "CDBP", StringComparison.OrdinalIgnoreCase);
    public bool IsTocd => string.Equals(Role, "TOCD", StringComparison.OrdinalIgnoreCase);
}
