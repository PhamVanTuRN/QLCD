using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Infrastructure.Services;

public class OrganizationScopeService : IOrganizationScopeService
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IQLCDDbContext _context;

    public OrganizationScopeService(ICurrentUserService currentUserService, IQLCDDbContext context)
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

        if (string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase) || 
            string.Equals(role, "CDCS", StringComparison.OrdinalIgnoreCase))
        {
            return null; // Null means unfiltered (all scopes)
        }

        if (!orgId.HasValue)
        {
            return new List<Guid>();
        }

        if (string.Equals(role, "CDBP", StringComparison.OrdinalIgnoreCase))
        {
            // CDBP scope: current CDBP + direct children (Tổ công đoàn)
            var childIds = await _context.DonViCongDoans
                .Where(u => u.MaParent == orgId.Value)
                .Select(u => u.Id)
                .ToListAsync(cancellationToken);

            var allowed = new List<Guid> { orgId.Value };
            allowed.AddRange(childIds);
            return allowed;
        }

        // TOCD / DOANVIEN scope: only current organization
        return new List<Guid> { orgId.Value };
    }

    public async Task<bool> IsInScopeAsync(Guid targetOrgId, CancellationToken cancellationToken = default)
    {
        var allowedIds = await GetAllowedOrganizationIdsAsync(cancellationToken);
        if (allowedIds == null)
        {
            return true; // Admin / CDCS can access any organization
        }

        return allowedIds.Contains(targetOrgId);
    }

    public async Task<bool> IsMemberInScopeAsync(Guid memberId, CancellationToken cancellationToken = default)
    {
        var member = await _context.DoanViens
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == memberId, cancellationToken);

        if (member == null)
        {
            return false;
        }

        return await IsInScopeAsync(member.MaToCongDoan, cancellationToken);
    }
}
