using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Accounts.Queries.GetAccounts;

public record GetAccountsQuery : IRequest<List<AccountDto>>;

public class AccountDto
{
    public Guid Id { get; set; }
    public required string Username { get; set; }
    public required string HoTen { get; set; }
    public required string VaiTro { get; set; }
    public Guid? OrganizationId { get; set; }
    public string? DonViTen { get; set; }
    public string? PasswordRaw { get; set; }
    public bool TrangThai { get; set; }
}

public class GetAccountsQueryHandler : IRequestHandler<GetAccountsQuery, List<AccountDto>>
{
    private readonly IQLCDDbContext _context;

    public GetAccountsQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<AccountDto>> Handle(GetAccountsQuery request, CancellationToken cancellationToken)
    {
        var list = await _context.TaiKhoans
            .Include(t => t.Organization)
            .OrderByDescending(t => t.CreatedDate)
            .Select(t => new AccountDto
            {
                Id = t.Id,
                Username = t.Username,
                HoTen = t.HoTen,
                VaiTro = t.VaiTro,
                OrganizationId = t.OrganizationId,
                DonViTen = t.Organization != null ? t.Organization.TenDonVi : "Hệ thống",
                PasswordRaw = t.PasswordRaw,
                TrangThai = t.TrangThai
            })
            .ToListAsync(cancellationToken);

        return list;
    }
}
