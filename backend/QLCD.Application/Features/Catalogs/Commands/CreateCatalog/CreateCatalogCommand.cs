using System.ComponentModel.DataAnnotations;
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
    [Required]
    public required string Loai { get; init; }
    [Required]
    public required string Ma { get; init; }
    [Required]
    public required string Ten { get; init; }
    public int ThuTu { get; init; }
    [StringLength(500)]
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
        if (request.Loai == "KhoiChuyenMon") throw new ArgumentException("Quản lý khối tại Khối quản lý, không tạo danh mục trùng lặp.");
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
