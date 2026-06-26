using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Queries.GetUnionMemberDetail;

public record GetUnionMemberDetailQuery(Guid Id) : IRequest<UnionMemberDetailDto?>;

public class UnionMemberDetailDto
{
    public Guid Id { get; set; }
    public required string HoTen { get; set; }
    public DateTime NgaySinh { get; set; }
    public int GioiTinh { get; set; }
    public string? QueQuan { get; set; }
    public string? DanToc { get; set; }
    public string? TonGiao { get; set; }
    public required string SoCCCD { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public string? DiaChiLienHe { get; set; }
    public string? AnhDaiDienUrl { get; set; }
    public required string MaNhanVien { get; set; }
    public QuanHam? CapBacQuanHam { get; set; }
    public string? ChucVu { get; set; }
    public string? ChucDanhChuyenMon { get; set; }
    public string? DonViCongTac { get; set; }
    public LoaiCanBo LoaiCanBo { get; set; }
    public Guid MaToCongDoan { get; set; }
    public string? TenToCongDoan { get; set; }
    public DateTime NgayVaoCongDoan { get; set; }
    public string? SoTheDoanVien { get; set; }
    public VaiTroCongDoan VaiTro { get; set; }
    public TrangThaiDoanVien TrangThai { get; set; }
    public string? TrinhDoHocVan { get; set; }
    public string? TrinhDoChuyenMon { get; set; }
    public string? HocHam { get; set; }
    public string? HocVi { get; set; }
    public string? ChuyenNganhDaoTao { get; set; }
    public string? TrinhDoLyLuanChinhTri { get; set; }
    public string DangVien { get; set; } = "khác";
    public string? GhiChu { get; set; }
    public List<MemberLanguageDetailDto> NgoaiNgus { get; set; } = new();
}

public class MemberLanguageDetailDto
{
    public Guid Id { get; set; }
    public required string NgoaiNgu { get; set; }
    public required string TrinhDo { get; set; }
    public decimal DiemSo { get; set; }
    public DateTime NgayCap { get; set; }
    public string? DonViCap { get; set; }
    public string? FileChungChiUrl { get; set; }
}

public class GetUnionMemberDetailQueryHandler : IRequestHandler<GetUnionMemberDetailQuery, UnionMemberDetailDto?>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;

    public GetUnionMemberDetailQueryHandler(IQLCDDbContext context, IOrganizationScopeService scopeService)
    {
        _context = context;
        _scopeService = scopeService;
    }

    public async Task<UnionMemberDetailDto?> Handle(GetUnionMemberDetailQuery request, CancellationToken cancellationToken)
    {
        var member = await _context.DoanViens
            .Include(d => d.ToCongDoan)
            .Include(d => d.DoanVienNgoaiNgus)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

        if (member == null) return null;

        // Scope validation
        if (!await _scopeService.IsInScopeAsync(member.MaToCongDoan, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền xem chi tiết đoàn viên ngoài phạm vi quản lý.");
        }

        return new UnionMemberDetailDto
        {
            Id = member.Id,
            HoTen = member.HoTen,
            NgaySinh = member.NgaySinh,
            GioiTinh = member.GioiTinh,
            QueQuan = member.QueQuan,
            DanToc = member.DanToc,
            TonGiao = member.TonGiao,
            SoCCCD = member.SoCCCD,
            DienThoai = member.DienThoai,
            Email = member.Email,
            DiaChiLienHe = member.DiaChiLienHe,
            AnhDaiDienUrl = member.AnhDaiDienUrl,
            MaNhanVien = member.MaNhanVien,
            CapBacQuanHam = member.CapBacQuanHam,
            ChucVu = member.ChucVu,
            ChucDanhChuyenMon = member.ChucDanhChuyenMon,
            DonViCongTac = member.DonViCongTac,
            LoaiCanBo = member.LoaiCanBo,
            MaToCongDoan = member.MaToCongDoan,
            TenToCongDoan = member.ToCongDoan?.TenDonVi,
            NgayVaoCongDoan = member.NgayVaoCongDoan,
            SoTheDoanVien = member.SoTheDoanVien,
            VaiTro = member.VaiTro,
            TrangThai = member.TrangThai,
            TrinhDoHocVan = member.TrinhDoHocVan,
            TrinhDoChuyenMon = member.TrinhDoChuyenMon,
            HocHam = member.HocHam,
            HocVi = member.HocVi,
            ChuyenNganhDaoTao = member.ChuyenNganhDaoTao,
            TrinhDoLyLuanChinhTri = member.TrinhDoLyLuanChinhTri,
            DangVien = member.DangVien,
            GhiChu = member.GhiChu,
            NgoaiNgus = member.DoanVienNgoaiNgus.Select(n => new MemberLanguageDetailDto
            {
                Id = n.Id,
                NgoaiNgu = n.NgoaiNgu,
                TrinhDo = n.TrinhDo,
                DiemSo = n.DiemSo,
                NgayCap = n.NgayCap,
                DonViCap = n.DonViCap,
                FileChungChiUrl = n.FileChungChiUrl
            }).ToList()
        };
    }
}
