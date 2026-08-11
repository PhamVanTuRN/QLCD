using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;

namespace AttendanceManagement.Infrastructure.Services;

public class OrganizationScopeService : IOrganizationScopeService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IAttendanceDbContext _context;

    public OrganizationScopeService(ICurrentUserService currentUserService, IAttendanceDbContext context)
    {
        _currentUserService = currentUserService;
        _context = context;
    }

    public async Task<List<Guid>?> GetAllowedOrganizationIdsAsync(CancellationToken cancellationToken = default)
    {
        var role = _currentUserService.Role;
        var orgId = _currentUserService.OrganizationId;

        if (string.IsNullOrEmpty(role))
        {
            return new List<Guid>();
        }

        if (string.Equals(role, "SYSTEM_ADMIN", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(role, "ATTENDANCE_ADMIN", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(role, "EVENT_MANAGER", StringComparison.OrdinalIgnoreCase))
        {
            return null; // Null means unfiltered (all scopes)
        }

        if (!orgId.HasValue)
        {
            return new List<Guid>();
        }

        if (string.Equals(role, "UNIT_MANAGER", StringComparison.OrdinalIgnoreCase))
        {
            // Unit manager scope: current department + direct child departments
            var childIds = await _context.Departments
                .Where(u => u.ParentId == orgId.Value)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var allowed = new List<Guid> { orgId.Value };
            allowed.AddRange(childIds);
            return allowed;
        }

        // USER scope: only current department
        return new List<Guid> { orgId.Value };
    }

    public async Task<bool> IsInScopeAsync(Guid targetOrgId, CancellationToken cancellationToken = default)
    {
        var allowedIds = await GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedIds == null)
        {
            return true; // Admin can access any organization
        }

        return allowedIds.Contains(targetOrgId);
    }

    public async Task<bool> IsMemberInScopeAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var member = await _context.Persons
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
        {
            return false;
        }

        return await IsInScopeAsync(member.DepartmentId, cancellationToken);
    }
}
