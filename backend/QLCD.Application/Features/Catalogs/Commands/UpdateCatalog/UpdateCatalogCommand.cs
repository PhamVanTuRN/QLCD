using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Catalogs.Commands.UpdateCatalog;

public record UpdateCatalogCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    public required string Ten { get; init; }
    public int ThuTu { get; init; }
    public bool TrangThai { get; init; }
    public string? GhiChu { get; init; }
}

public class UpdateCatalogCommandHandler : IRequestHandler<UpdateCatalogCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public UpdateCatalogCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(UpdateCatalogCommand request, CancellationToken cancellationToken)
    {
        var catalog = await _context.DanhMucDungChungs
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (catalog == null)
        {
            throw new ArgumentException("Danh mục không tồn tại.");
        }

        catalog.Ten = request.Ten;
        catalog.ThuTu = request.ThuTu;
        catalog.TrangThai = request.TrangThai;
        catalog.GhiChu = request.GhiChu;

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
