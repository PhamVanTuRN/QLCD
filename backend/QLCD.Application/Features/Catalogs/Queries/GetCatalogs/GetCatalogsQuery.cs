using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Catalogs.Queries.GetCatalogs;

public record GetCatalogsQuery : IRequest<List<CatalogDto>>
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = PageBounds.DefaultSize;
    public string? Loai { get; init; }
    public string? Search { get; init; }
    public bool? ActiveOnly { get; init; }
}

public class CatalogDto
{
    public Guid Id { get; set; }
    public required string Loai { get; set; }
    public required string Ma { get; set; }
    public required string Ten { get; set; }
    public int ThuTu { get; set; }
    public bool TrangThai { get; set; }
    public string? GhiChu { get; set; }
}

public class GetCatalogsQueryHandler : IRequestHandler<GetCatalogsQuery, List<CatalogDto>>
{
    private readonly IQLCDDbContext _context;

    public GetCatalogsQueryHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<List<CatalogDto>> Handle(GetCatalogsQuery request, CancellationToken cancellationToken)
    {
        var offset = PageBounds.Offset(request.Page, request.PageSize);
        var query = _context.DanhMucDungChungs.AsNoTracking();

        if (!string.IsNullOrEmpty(request.Loai))
        {
            query = query.Where(c => c.Loai == request.Loai);
        }

        var search = PageBounds.Search(request.Search);
        if (search is not null)
        {
            query = query.Where(c => c.Ten.ToLower().Contains(search) || c.Ma.ToLower().Contains(search));
        }

        if (request.ActiveOnly == true)
        {
            query = query.Where(c => c.TrangThai);
        }

        var list = await query
            .OrderBy(c => c.Loai)
            .ThenBy(c => c.ThuTu)
            .ThenBy(c => c.Id)
            .Skip(offset).Take(request.PageSize + 1)
            .Select(c => new CatalogDto
            {
                Id = c.Id,
                Loai = c.Loai,
                Ma = c.Ma,
                Ten = c.Ten,
                ThuTu = c.ThuTu,
                TrangThai = c.TrangThai,
                GhiChu = c.GhiChu
            })
            .ToListAsync(cancellationToken);

        return list;
    }
}
