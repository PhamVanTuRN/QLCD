using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Commands.UpdateUnionMember;

public record UpdateUnionMemberCommand : IRequest<bool>
{
    public Guid Id { get; init; }
    [Required, StringLength(100)]
    public required string HoTen { get; init; }
    public DateTime NgaySinh { get; init; }
    [Range(0, 2)]
    public int GioiTinh { get; init; }
    public string? QueQuan { get; init; }
    public string? DanToc { get; init; }
    public string? TonGiao { get; init; }
    [Required, StringLength(12)]
    public required string SoCCCD { get; init; }
    [StringLength(30)]
    public string? DienThoai { get; init; }
    [StringLength(254), EmailAddress]
    public string? Email { get; init; }
    public string? DiaChiLienHe { get; init; }
    [Required, StringLength(20)]
    public required string MaNhanVien { get; init; }
    public QuanHam? CapBacQuanHam { get; init; }
    public string? ChucVu { get; init; }
    public string? ChucDanhChuyenMon { get; init; }
    public string? DonViCongTac { get; init; }
    public LoaiCanBo LoaiCanBo { get; init; }
    public Guid MaToCongDoan { get; init; }
    public DateTime NgayVaoCongDoan { get; init; }
    public string? SoTheDoanVien { get; init; }
    [EnumDataType(typeof(VaiTroCongDoan))]
    public VaiTroCongDoan VaiTro { get; init; }
    public string? TrinhDoHocVan { get; init; }
    public string? TrinhDoChuyenMon { get; init; }
    public string? HocHam { get; init; }
    public string? HocVi { get; init; }
    public string? ChuyenNganhDaoTao { get; init; }
    public string? TrinhDoLyLuanChinhTri { get; init; }
    public bool DangVien { get; init; }
    [EnumDataType(typeof(TrangThaiDoanVien))]
    public TrangThaiDoanVien TrangThai { get; init; }
    [StringLength(500)]
    public string? GhiChu { get; init; }
    [MaxLength(20)]
    public List<UpdateMemberLanguageDto>? NgoaiNgus { get; init; }
}

public class UpdateMemberLanguageDto
{
    [Required, StringLength(100)]
    public required string NgoaiNgu { get; set; }
    [Required, StringLength(50)]
    public required string TrinhDo { get; set; }
    public decimal DiemSo { get; set; }
    public DateTime NgayCap { get; set; }
    public string? DonViCap { get; set; }
    [StringLength(500)]
    public string? FileChungChiUrl { get; set; }
}

public class UpdateUnionMemberCommandHandler : IRequestHandler<UpdateUnionMemberCommand, bool>
{
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICertificateLinkPolicy _certificateLinks;

    public UpdateUnionMemberCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService, ICertificateLinkPolicy certificateLinks)
    {
        _context = context;
        _scopeService = scopeService;
        _certificateLinks = certificateLinks;
    }

    public async Task<bool> Handle(UpdateUnionMemberCommand request, CancellationToken cancellationToken)
    {
        var member = await _context.DoanViens
            .Include(d => d.DoanVienNgoaiNgus)
            .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);
        if (member == null)
        {
            throw new ArgumentException("Đoàn viên không tồn tại.");
        }

        // Scope validation - original unit
        if (!await _scopeService.IsInScopeAsync(member.MaToCongDoan, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền chỉnh sửa đoàn viên ngoài phạm vi quản lý.");
        }

        if (request.MaToCongDoan != member.MaToCongDoan)
            throw new ArgumentException("Đổi đơn vị phải thực hiện qua chức năng chuyển sinh hoạt.");

        // Kiểm tra trùng CCCD
        var existsCccd = await _context.DoanViens.AnyAsync(d => d.SoCCCD == request.SoCCCD && d.Id != request.Id, cancellationToken);
        if (existsCccd)
        {
            throw new ArgumentException("Số CCCD/CMTQĐ đã bị trùng với đoàn viên khác.");
        }

        // Kiểm tra trùng Mã NV
        var existsMaNv = await _context.DoanViens.AnyAsync(d => d.MaNhanVien == request.MaNhanVien && d.Id != request.Id, cancellationToken);
        if (existsMaNv)
        {
            throw new ArgumentException("Mã nhân viên đã bị trùng với đoàn viên khác.");
        }

        // Kiểm tra Đơn vị công đoàn
        var toCongDoan = await _context.DonViCongDoans.FirstOrDefaultAsync(u => u.Id == request.MaToCongDoan, cancellationToken);
        if (toCongDoan == null)
        {
            throw new ArgumentException("Đơn vị công đoàn chỉ định không tồn tại.");
        }

        // Cập nhật thông tin chính
        member.HoTen = request.HoTen;
        member.NgaySinh = request.NgaySinh;
        member.GioiTinh = request.GioiTinh;
        member.QueQuan = request.QueQuan;
        member.DanToc = request.DanToc;
        member.TonGiao = request.TonGiao;
        member.SoCCCD = request.SoCCCD;
        member.DienThoai = request.DienThoai;
        member.Email = request.Email;
        member.DiaChiLienHe = request.DiaChiLienHe;
        member.MaNhanVien = request.MaNhanVien;
        member.CapBacQuanHam = request.CapBacQuanHam;
        member.ChucVu = request.ChucVu;
        member.ChucDanhChuyenMon = request.ChucDanhChuyenMon;
        member.DonViCongTac = request.DonViCongTac;
        member.LoaiCanBo = request.LoaiCanBo;
        member.NgayVaoCongDoan = request.NgayVaoCongDoan;
        member.SoTheDoanVien = request.SoTheDoanVien;
        member.VaiTro = request.VaiTro;
        member.TrinhDoHocVan = request.TrinhDoHocVan;
        member.TrinhDoChuyenMon = request.TrinhDoChuyenMon;
        member.HocHam = request.HocHam;
        member.HocVi = request.HocVi;
        member.ChuyenNganhDaoTao = request.ChuyenNganhDaoTao;
        member.TrinhDoLyLuanChinhTri = request.TrinhDoLyLuanChinhTri;
        member.DangVien = request.DangVien;
        member.TrangThai = request.TrangThai;
        member.GhiChu = request.GhiChu;

        // Cập nhật ngoại ngữ (Xóa cũ, Thêm mới)
        _context.DoanVienNgoaiNgus.RemoveRange(member.DoanVienNgoaiNgus);
        if (request.NgoaiNgus != null && request.NgoaiNgus.Count > 0)
        {
            foreach (var lang in request.NgoaiNgus)
            {
                _context.DoanVienNgoaiNgus.Add(new DoanVienNgoaiNgu
                {
                    DoanVienId = member.Id,
                    NgoaiNgu = lang.NgoaiNgu,
                    TrinhDo = lang.TrinhDo,
                    DiemSo = lang.DiemSo,
                    NgayCap = lang.NgayCap,
                    DonViCap = lang.DonViCap,
                    FileChungChiUrl = _certificateLinks.RequireAllowedUrl(lang.FileChungChiUrl)
                });
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
