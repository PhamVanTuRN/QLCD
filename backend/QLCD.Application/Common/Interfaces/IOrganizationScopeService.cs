using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace QLCD.Application.Common.Interfaces;

public interface IOrganizationScopeService
{
    Task<List<Guid>?> GetAllowedOrganizationIdsAsync(CancellationToken cancellationToken = default);
    Task<bool> IsInScopeAsync(Guid targetOrgId, CancellationToken cancellationToken = default);
    Task<bool> IsMemberInScopeAsync(Guid memberId, CancellationToken cancellationToken = default);
}
