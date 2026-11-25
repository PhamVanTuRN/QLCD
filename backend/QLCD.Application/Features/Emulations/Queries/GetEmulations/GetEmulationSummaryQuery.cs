using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Emulations.Queries.GetEmulations;

public sealed record GetEmulationSummaryQuery(int Year) : IRequest<EmulationSummary>;
public sealed record EmulationSummary(int Year, int Registered, int Evaluated, int Awarded, IReadOnlyList<EmulationRatingCount> Ratings);
public sealed record EmulationRatingCount(string Code, string Name, int Count);

public sealed class GetEmulationSummaryQueryHandler(IQLCDDbContext db, IOrganizationScopeService scope)
    : IRequestHandler<GetEmulationSummaryQuery, EmulationSummary>
{
    public async Task<EmulationSummary> Handle(GetEmulationSummaryQuery request, CancellationToken cancellationToken)
    {
        if (request.Year is < 1900 or > 2100)
            throw new ArgumentOutOfRangeException(nameof(request.Year));

        var allowed = await scope.GetAllowedOrganizationIdsAsync(cancellationToken);
        var groups = await EmulationScope.Apply(db.ThiDuaCongDoans.AsNoTracking(), allowed)
            .Where(record => record.Nam == request.Year)
            .GroupBy(record => new { record.TrangThai, record.XepLoai })
            .Select(group => new { group.Key.TrangThai, group.Key.XepLoai, Count = group.Count() })
            .ToListAsync(cancellationToken);

        var labels = await db.DanhMucDungChungs.AsNoTracking()
            .Where(item => item.Loai == "ChatLuongDoanVien")
            .ToDictionaryAsync(item => item.Ma, item => item.Ten, cancellationToken);
        var ratings = groups.Where(group => group.TrangThai is 2 or 3 && !string.IsNullOrWhiteSpace(group.XepLoai))
            .GroupBy(group => group.XepLoai)
            .Select(group => new EmulationRatingCount(group.Key, labels.GetValueOrDefault(group.Key, group.Key), group.Sum(row => row.Count)))
            .OrderByDescending(row => row.Count).ThenBy(row => row.Code)
            .ToList();

        return new EmulationSummary(request.Year,
            groups.Where(group => group.TrangThai == 1).Sum(group => group.Count),
            groups.Where(group => group.TrangThai == 2).Sum(group => group.Count),
            groups.Where(group => group.TrangThai == 3).Sum(group => group.Count),
            ratings);
    }
}
