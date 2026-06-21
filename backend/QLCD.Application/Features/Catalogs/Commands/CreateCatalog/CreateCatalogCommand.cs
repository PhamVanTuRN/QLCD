using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;

namespace QLCD.Application.Features.Catalogs.Commands.CreateCatalog;

public record CreateCatalogCommand : IRequest<Guid>
{
    public required string Loai { get; init; }
    public required string Ma { get; init; }
    public required string Ten { get; init; }
    public int ThuTu { get; init; }
    public string? GhiChu { get; init; }
}

public class CreateCatalogCommandHandler : IRequestHandler<CreateCatalogCommand, Guid>
{
    private readonly IQLCDDbContext _context;

    public CreateCatalogCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateCatalogCommand request, CancellationToken cancellationToken)
    {
        var normalizedMa = request.Ma.Trim().ToUpper();
        var exists = await _context.DanhMucDungChungs
            .AnyAsync(c => c.Loai == request.Loai && c.Ma == normalizedMa, cancellationToken);
        if (exists)
        {
            throw new ArgumentException($"Mã danh mục '{request.Ma}' đã tồn tại trong nhóm '{request.Loai}'.");
        }

        var catalog = new DanhMucDungChung
        {
            Loai = request.Loai,
            Ma = normalizedMa,
            Ten = request.Ten,
            ThuTu = request.ThuTu,
            TrangThai = true,
            GhiChu = request.GhiChu
        };

        _context.DanhMucDungChungs.Add(catalog);
        await _context.SaveChangesAsync(cancellationToken);

        return catalog.Id;
    }
}
