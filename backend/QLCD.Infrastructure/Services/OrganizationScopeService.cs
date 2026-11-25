using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Security;

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

        if (!SecurityRoles.IsStaff(role))
            return [];
        if (role == SecurityRoles.Admin)
            return null;
        if (!orgId.HasValue || orgId == Guid.Empty)
            return [];
        if (role == SecurityRoles.Central)
            return null;

        if (role == SecurityRoles.Department)
        {
            // CDBP scope: current CDBP + direct children (Tổ công đoàn)
            var childIds = await _context.DonViCongDoans
                .Where(u => u.MaParent == orgId.Value && u.TrangThai == 1)
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
        return targetOrgId != Guid.Empty
            && (allowedIds is null || allowedIds.Contains(targetOrgId))
            && await _context.DonViCongDoans.AnyAsync(unit => unit.Id == targetOrgId && unit.TrangThai == 1, cancellationToken);
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
