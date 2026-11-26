using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Accounts.Queries.GetAccounts;

public record GetAccountsQuery : IRequest<List<AccountDto>>
{
    public string? Search { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageBounds.DefaultSize;
}

public class AccountDto
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string HoTen { get; set; }
    public required string VaiTro { get; set; }
    public Guid? OrganizationId { get; set; }
    public string? DonViTen { get; set; }
    public bool OrganizationActive { get; set; }
    public bool AccountArchived { get; set; }
    public bool CanSignIn { get; set; }
    public bool MustChangePassword { get; set; }
    public bool TrangThai { get; set; }
    public bool AuthenticatorEnabled { get; set; }
    public bool ActivationPending { get; set; }
    public bool CanIssueActivation { get; set; }
}

public class GetAccountsQueryHandler : IRequestHandler<GetAccountsQuery, List<AccountDto>>
{
    private const string SystemOrganizationName = "Hệ thống";
    private readonly IQLCDDbContext _context;

    public GetAccountsQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<AccountDto>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var search = PageBounds.Search(request.Search);
        var operational = _context.DonViCongDoans.OperationalUnits();
        // Include legacy soft-deleted organization accounts in the administration list.
        var query = _context.TaiKhoans.IgnoreQueryFilters().AsNoTracking()
            .Where(a => !a.IsDeleted || a.OrganizationId != null);
        if (search is not null)
        {
            var matchesSystemOrganization = SystemOrganizationName.ToLowerInvariant().Contains(search, StringComparison.Ordinal);
            query = query.Where(account => account.Username.ToLower().Contains(search)
                || account.HoTen.ToLower().Contains(search)
                || (account.Organization != null
                    ? account.Organization.TenDonVi.ToLower().Contains(search)
                    : matchesSystemOrganization));
        }

        return await query
            .OrderByDescending(t => t.CreatedDate)
            .ThenBy(t => t.Id)
            .Skip(offset).Take(request.PageSize + 1)
            .Select(t => new AccountDto
            {
                OrganizationActive = t.OrganizationId == null || operational.Any(u => u.Id == t.OrganizationId),
                AccountArchived = t.IsDeleted,
                CanSignIn = !t.IsDeleted && t.TrangThai && (t.OrganizationId == null || operational.Any(u => u.Id == t.OrganizationId)),
                Id = t.Id,
                Username = t.Username,
                HoTen = t.HoTen,
                VaiTro = t.VaiTro,
                OrganizationId = t.OrganizationId,
                DonViTen = t.Organization != null ? t.Organization.TenDonVi : SystemOrganizationName,
                MustChangePassword = t.MustChangePassword,
                TrangThai = t.TrangThai,
                AuthenticatorEnabled = t.ProtectedMfaSecret != null,
                ActivationPending = t.ActivationCodeHash != null,
                CanIssueActivation = !t.IsDeleted && t.ProtectedMfaSecret == null && t.ActivationCodeHash == null
            })
            .ToListAsync(cancellationToken);
    }
}
