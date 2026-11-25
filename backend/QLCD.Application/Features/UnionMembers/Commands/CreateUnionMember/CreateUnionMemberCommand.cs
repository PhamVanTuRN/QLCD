using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;
using System.Data;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;

public record CreateUnionMemberCommand : IRequest<Guid>
{
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
    public LoaiCanBo LoaiCanBo { get; init; } = LoaiCanBo.Khac;
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
    public DateTime? NgayVaoDang { get; init; }
    [StringLength(500)]
    public string? GhiChu { get; init; }
    [MaxLength(20)]
    public List<CreateMemberLanguageDto>? NgoaiNgus { get; init; }
}

public class CreateMemberLanguageDto
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

public sealed class DuplicateMemberException()
    : Exception("Số CCCD/CMTQĐ hoặc mã nhân viên đã được sử dụng.");

public class CreateUnionMemberCommandHandler : IRequestHandler<CreateUnionMemberCommand, Guid>
{
    // SQL enforces uniqueness with indexes. The InMemory provider does not enforce unique indexes.
    private static readonly SemaphoreSlim InMemoryMemberCreation = new(1, 1);
    private readonly IQLCDDbContext _context;
    private readonly IOrganizationScopeService _scopeService;
    private readonly ICertificateLinkPolicy _certificateLinks;
    private readonly ICurrentUserService _currentUser;

    public CreateUnionMemberCommandHandler(IQLCDDbContext context, IOrganizationScopeService scopeService,
        ICertificateLinkPolicy certificateLinks, ICurrentUserService currentUser)
    {
        _context = context;
        _scopeService = scopeService;
        _certificateLinks = certificateLinks;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(CreateUnionMemberCommand request, CancellationToken cancellationToken)
    {
        if (_context.Database.IsRelational())
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            var memberId = await CreateAsync(request, cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return memberId;
        }

        await InMemoryMemberCreation.WaitAsync(cancellationToken);
        try
        {
            return await CreateAsync(request, cancellationToken);
        }
        finally
        {
            InMemoryMemberCreation.Release();
        }
    }

    private async Task<Guid> CreateAsync(CreateUnionMemberCommand request, CancellationToken cancellationToken)
    {
        if (!await _scopeService.IsInScopeAsync(request.MaToCongDoan, cancellationToken))
        {
            throw new UnauthorizedAccessException("Không có quyền tạo mới đoàn viên ngoài phạm vi quản lý.");
        }

        var canReceiveMember = await _context.DonViCongDoans.EligibleUnits()
            .AnyAsync(unit => unit.Id == request.MaToCongDoan, cancellationToken);
        if (!canReceiveMember)
        {
            throw new FluentValidation.ValidationException([
                new ValidationFailure(nameof(request.MaToCongDoan),
                    "Chọn tổ công đoàn đang hoạt động hoặc Công đoàn bộ phận đang hoạt động chưa có tổ.")
            ]);
        }

        var identityNumber = request.SoCCCD.Trim();
        var employeeNumber = request.MaNhanVien.Trim();
        if (await _context.DoanViens.IgnoreQueryFilters().AnyAsync(
            member => member.SoCCCD == identityNumber || member.MaNhanVien == employeeNumber, cancellationToken))
            throw new DuplicateMemberException();

        var newMember = new DoanVien
        {
            HoTen = request.HoTen.Trim(),
            NgaySinh = request.NgaySinh,
            GioiTinh = request.GioiTinh,
            QueQuan = request.QueQuan,
            DanToc = request.DanToc,
            TonGiao = request.TonGiao,
            SoCCCD = identityNumber,
            DienThoai = request.DienThoai,
            Email = request.Email,
            DiaChiLienHe = request.DiaChiLienHe,
            MaNhanVien = employeeNumber,
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
        _context.LichSuBienDongs.Add(new LichSuBienDong
        {
            DoanVienId = newMember.Id,
            LoaiBienDong = LoaiBienDong.KetNapMoi,
            DenToCongDoanId = newMember.MaToCongDoan,
            LyDo = "Tiếp nhận hồ sơ đoàn viên",
            NgayHieuLuc = newMember.NgayVaoCongDoan,
            NguoiThucHienId = _currentUser.UserId ?? Guid.Empty
        });

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
                    FileChungChiUrl = _certificateLinks.RequireAllowedUrl(lang.FileChungChiUrl)
                };
                _context.DoanVienNgoaiNgus.Add(newLang);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return newMember.Id;
    }
}
