using System;

namespace QLCD.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Username { get; }
    string? Role { get; }
    Guid? OrganizationId { get; }
    bool IsAdmin { get; }
    bool IsCdcs { get; }
    bool IsCdbp { get; }
    bool IsTocd { get; }
}
