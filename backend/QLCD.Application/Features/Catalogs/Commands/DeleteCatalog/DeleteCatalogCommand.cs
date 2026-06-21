using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;

namespace QLCD.Application.Features.Catalogs.Commands.DeleteCatalog;

public record DeleteCatalogCommand(Guid Id) : IRequest<bool>;

public class DeleteCatalogCommandHandler : IRequestHandler<DeleteCatalogCommand, bool>
{
    private readonly IQLCDDbContext _context;

    public DeleteCatalogCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<bool> Handle(DeleteCatalogCommand request, CancellationToken cancellationToken)
    {
        var catalog = await _context.DanhMucDungChungs
            .FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (catalog == null)
        {
            throw new ArgumentException("Danh mục không tồn tại.");
        }

        var code = catalog.Ma;

        // 1. Kiểm tra sử dụng trong DoanVien
        var isUsedInMember = await _context.DoanViens.AnyAsync(d =>
            d.DanToc == code ||
            d.TonGiao == code ||
            d.TrinhDoHocVan == code ||
            d.TrinhDoChuyenMon == code ||
            d.HocHam == code ||
            d.HocVi == code ||
            d.ChucVu == code, cancellationToken);

        if (isUsedInMember)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng bởi thông tin đoàn viên. Hãy ngừng kích hoạt để ẩn đi.");
        }

        // 2. Kiểm tra sử dụng trong DoanVienNgoaiNgu
        var isUsedInLanguage = await _context.DoanVienNgoaiNgus.AnyAsync(n =>
            n.NgoaiNgu == code || n.TrinhDo == code, cancellationToken);

        if (isUsedInLanguage)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong danh sách ngoại ngữ của đoàn viên. Hãy ngừng kích hoạt để ẩn đi.");
        }

        // 3. Kiểm tra sử dụng trong HoatDongCongDoan
        var isUsedInActivity = await _context.HoatDongCongDoans.AnyAsync(a =>
            a.LoaiHoatDong == code, cancellationToken);

        if (isUsedInActivity)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong các hoạt động công đoàn. Hãy ngừng kích hoạt.");
        }

        // 4. Kiểm tra sử dụng trong TaiChinhCongDoan
        var isUsedInFinance = await _context.TaiChinhCongDoans.AnyAsync(f =>
            f.LoaiGiaoDich == code, cancellationToken);

        if (isUsedInFinance)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong các giao dịch tài chính. Hãy ngừng kích hoạt.");
        }

        // 5. Kiểm tra sử dụng trong PhucLoiDoanVien
        var isUsedInWelfare = await _context.PhucLoiDoanViens.AnyAsync(w =>
            w.LoaiPhucLoi == code, cancellationToken);

        if (isUsedInWelfare)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong các quyết định phúc lợi/cứu trợ. Hãy ngừng kích hoạt.");
        }

        // 6. Kiểm tra sử dụng trong SangKien
        var isUsedInInitiative = await _context.SangKiens.AnyAsync(i =>
            i.CapDeTai == code, cancellationToken);

        if (isUsedInInitiative)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong thông tin đề tài/sáng kiến. Hãy ngừng kích hoạt.");
        }

        // 7. Kiểm tra sử dụng trong ThiDuaCongDoan
        var isUsedInEmulation = await _context.ThiDuaCongDoans.AnyAsync(e =>
            e.XepLoai == code, cancellationToken);

        if (isUsedInEmulation)
        {
            throw new InvalidOperationException("Không thể xóa danh mục này vì đã được sử dụng trong kết quả thi đua. Hãy ngừng kích hoạt.");
        }

        // Soft delete danh mục
        catalog.IsDeleted = true;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
