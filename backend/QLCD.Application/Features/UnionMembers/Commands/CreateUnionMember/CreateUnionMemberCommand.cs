using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;

public record CreateUnionMemberCommand : IRequest<Guid>
{
    public required string HoTen { get; init; }
    public DateTime NgaySinh { get; init; }
    public int GioiTinh { get; init; }
    public string? QueQuan { get; init; }
    public string? DanToc { get; init; }
    public string? TonGiao { get; init; }
    public required string SoCCCD { get; init; }
    public string? DienThoai { get; init; }
    public string? Email { get; init; }
    public string? DiaChiLienHe { get; init; }
    public required string MaNhanVien { get; init; }
    public QuanHam? CapBacQuanHam { get; init; }
    public string? ChucVu { get; init; }
    public string? ChucDanhChuyenMon { get; init; }
    public string? DonViCongTac { get; init; }
    public LoaiCanBo LoaiCanBo { get; init; }
    public Guid MaToCongDoan { get; init; }
    public DateTime NgayVaoCongDoan { get; init; }
    public string? SoTheDoanVien { get; init; }
    public VaiTroCongDoan VaiTro { get; init; }
    public string? TrinhDoHocVan { get; init; }
    public string? TrinhDoChuyenMon { get; init; }
    public string? HocHam { get; init; }
    public string? HocVi { get; init; }
    public string? ChuyenNganhDaoTao { get; init; }
    public string? TrinhDoLyLuanChinhTri { get; init; }
    public string DangVien { get; init; } = "khác";
    public DateTime? NgayVaoDang { get; init; }
    public string? GhiChu { get; init; }
    public List<CreateMemberLanguageDto>? NgoaiNgus { get; init; }
}

public class CreateMemberLanguageDto
{
    public required string NgoaiNgu { get; set; }
    public required string TrinhDo { get; set; }
    public decimal DiemSo { get; set; }
    public DateTime NgayCap { get; set; }
    public string? DonViCap { get; set; }
    public string? FileChungChiUrl { get; set; }
}

public class CreateUnionMemberCommandHandler : IRequestHandler<CreateUnionMemberCommand, Guid>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public CreateUnionMemberCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<Guid> Handle(CreateUnionMemberCommand request, CancellationToken cancellationToken)
    {
        // Scope validation
        if (!await _scopeService.IsInScopeAsync(request.MaToCongDoan, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền tạo mới đoàn viên ngoài phạm vi quản lý.");
        }

        // 1. Kiểm tra tính duy nhất của CCCD và Mã nhân viên
        var existsCccd = await _context.DoanViens.AnyAsync(d => d.SoCCCD == request.SoCCCD, cancellationToken);
        if (existsCccd)
        {
            throw new ArgumentException("Số CCCD/CMTQĐ đã tồn tại trong hệ thống.");
        }

        var existsMaNv = await _context.DoanViens.AnyAsync(d => d.MaNhanVien == request.MaNhanVien, cancellationToken);
        if (existsMaNv)
        {
            throw new ArgumentException("Mã nhân viên đã tồn tại trong hệ thống.");
        }

        // 2. Kiểm tra đơn vị đích có tồn tại không
        var toCongDoan = await _context.DonViCongDoans
            .FirstOrDefaultAsync(u => u.Id == request.MaToCongDoan, cancellationToken);
        if (toCongDoan == null)
        {
            throw new ArgumentException("Đơn vị công đoàn chỉ định không tồn tại.");
        }

        var newMember = new DoanVien
        {
            HoTen = request.HoTen,
            NgaySinh = request.NgaySinh,
            GioiTinh = request.GioiTinh,
            QueQuan = request.QueQuan,
            DanToc = request.DanToc,
            TonGiao = request.TonGiao,
            SoCCCD = request.SoCCCD,
            DienThoai = request.DienThoai,
            Email = request.Email,
            DiaChiLienHe = request.DiaChiLienHe,
            MaNhanVien = request.MaNhanVien,
            CapBacQuanHam = request.CapBacQuanHam,
            ChucVu = request.ChucVu,
            ChucDanhChuyenMon = request.ChucDanhChuyenMon,
            DonViCongTac = request.DonViCongTac,
            LoaiCanBo = request.LoaiCanBo,
            MaToCongDoan = request.MaToCongDoan,
            NgayVaoCongDoan = request.NgayVaoCongDoan,
            SoTheDoanVien = request.SoTheDoanVien,
            VaiTro = request.VaiTro,
            TrinhDoHocVan = request.TrinhDoHocVan,
            TrinhDoChuyenMon = request.TrinhDoChuyenMon,
            HocHam = request.HocHam,
            HocVi = request.HocVi,
            ChuyenNganhDaoTao = request.ChuyenNganhDaoTao,
            TrinhDoLyLuanChinhTri = request.TrinhDoLyLuanChinhTri,
            DangVien = request.DangVien,
            GhiChu = request.GhiChu,
            TrangThai = TrangThaiDoanVien.DangSinhHoat
        };

        _context.DoanViens.Add(newMember);
        await _context.SaveChangesAsync(cancellationToken);

        // Thêm ngoại ngữ
        if (request.NgoaiNgus != null && request.NgoaiNgus.Count > 0)
        {
            foreach (var lang in request.NgoaiNgus)
            {
                var newLang = new DoanVienNgoaiNgu
                {
                    DoanVienId = newMember.Id,
                    NgoaiNgu = lang.NgoaiNgu,
                    TrinhDo = lang.TrinhDo,
                    DiemSo = lang.DiemSo,
                    NgayCap = lang.NgayCap,
                    DonViCap = lang.DonViCap,
                    FileChungChiUrl = lang.FileChungChiUrl
                };
                _context.DoanVienNgoaiNgus.Add(newLang);
            }
            await _context.SaveChangesAsync(cancellationToken);
        }

        return newMember.Id;
    }
}
