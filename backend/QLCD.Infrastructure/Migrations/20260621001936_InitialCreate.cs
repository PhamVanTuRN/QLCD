using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    EntityName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    RecordId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    OldValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NewValues = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DanhMucDungChungs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Loai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Ma = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Ten = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    ThuTu = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DanhMucDungChungs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "KhoiChuyenMons",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenKhoi = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KhoiChuyenMons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DonViCongDoans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenDonVi = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    LoaiToChuc = table.Column<int>(type: "int", nullable: false),
                    Level = table.Column<int>(type: "int", nullable: false),
                    MaParent = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    MaKhoi = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DonViCongDoans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DonViCongDoans_DonViCongDoans_MaParent",
                        column: x => x.MaParent,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DonViCongDoans_KhoiChuyenMons_MaKhoi",
                        column: x => x.MaKhoi,
                        principalTable: "KhoiChuyenMons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DoanViens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    HoTen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    NgaySinh = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GioiTinh = table.Column<int>(type: "int", nullable: false),
                    QueQuan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DanToc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TonGiao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SoCCCD = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    DienThoai = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DiaChiLienHe = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AnhDaiDienUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MaNhanVien = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CapBacQuanHam = table.Column<int>(type: "int", nullable: true),
                    ChucVu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChucDanhChuyenMon = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DonViCongTac = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LoaiCanBo = table.Column<int>(type: "int", nullable: false),
                    MaToCongDoan = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NgayVaoCongDoan = table.Column<DateTime>(type: "datetime2", nullable: false),
                    SoTheDoanVien = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    VaiTro = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    TrinhDoHocVan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrinhDoChuyenMon = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HocHam = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HocVi = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ChuyenNganhDaoTao = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrinhDoLyLuanChinhTri = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrinhDoQuanLyNhaNuoc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrinhDoTinHoc = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TinhTrangHonNhan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SoCon = table.Column<int>(type: "int", nullable: false),
                    CoConDuoi16Tuoi = table.Column<bool>(type: "bit", nullable: false),
                    HoanCanhKhoiKhai = table.Column<bool>(type: "bit", nullable: false),
                    GiaDinhChinhSach = table.Column<bool>(type: "bit", nullable: false),
                    LaThuongBinhBenhBinh = table.Column<bool>(type: "bit", nullable: false),
                    ThanNhanLietSi = table.Column<bool>(type: "bit", nullable: false),
                    NguoiCoCong = table.Column<bool>(type: "bit", nullable: false),
                    ONhaCongVu = table.Column<bool>(type: "bit", nullable: false),
                    NguoiLienHeKhanCap = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DienThoaiLienHeKhanCap = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DangVien = table.Column<bool>(type: "bit", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoanViens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoanViens_DonViCongDoans_MaToCongDoan",
                        column: x => x.MaToCongDoan,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "HoatDongCongDoans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenHoatDong = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    LoaiHoatDong = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TuNgay = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DenNgay = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DiaDiem = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    MaQRCode = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    KinhPhi = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    KetQua = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    FileMinhChungUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HoatDongCongDoans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HoatDongCongDoans_DonViCongDoans_DonViId",
                        column: x => x.DonViId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TaiKhoans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    HoTen = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    VaiTro = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    PasswordRaw = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaiKhoans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaiKhoans_DonViCongDoans_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DoanVienNgoaiNgus",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    NgoaiNgu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TrinhDo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DiemSo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NgayCap = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DonViCap = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayHetHan = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FileChungChiUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoanVienNgoaiNgus", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoanVienNgoaiNgus_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LichSuBienDongs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoaiBienDong = table.Column<int>(type: "int", nullable: false),
                    TuToCongDoanId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DenToCongDoanId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    LyDo = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    NgayHieuLuc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NguoiThucHienId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileMinhChungUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LichSuBienDongs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LichSuBienDongs_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LichSuBienDongs_DonViCongDoans_DenToCongDoanId",
                        column: x => x.DenToCongDoanId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LichSuBienDongs_DonViCongDoans_TuToCongDoanId",
                        column: x => x.TuToCongDoanId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PhucLoiDoanViens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoaiPhucLoi = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    KinhPhiHoTro = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NgayHoTro = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LyDo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    FileMinhChungUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhucLoiDoanViens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhucLoiDoanViens_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PhucLoiDoanViens_DonViCongDoans_DonViId",
                        column: x => x.DonViId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SangKiens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenDeTai = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    LinhVuc = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    CapDeTai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    HieuQuaKinhTe = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    NgayNghiemThu = table.Column<DateTime>(type: "datetime2", nullable: true),
                    NamThucHien = table.Column<int>(type: "int", nullable: false),
                    KetQuaNghiemThu = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SangKiens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SangKiens_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SangKiens_DonViCongDoans_DonViId",
                        column: x => x.DonViId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "TaiChinhCongDoans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LoaiGiaoDich = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SoTien = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NgayGiaoDich = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NguoiGiaoDich = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ThangNam = table.Column<string>(type: "nvarchar(7)", maxLength: 7, nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaiChinhCongDoans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaiChinhCongDoans_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaiChinhCongDoans_DonViCongDoans_DonViId",
                        column: x => x.DonViId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ThiDuaCongDoans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TenPhongTrao = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    DoanVienId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    DonViId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Nam = table.Column<int>(type: "int", nullable: false),
                    DiemTuDanhGia = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiemBchDuyet = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    XepLoai = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    KhenThuong = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: true),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ThiDuaCongDoans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ThiDuaCongDoans_DoanViens_DoanVienId",
                        column: x => x.DoanVienId,
                        principalTable: "DoanViens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ThiDuaCongDoans_DonViCongDoans_DonViId",
                        column: x => x.DonViId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DanhMucDungChungs_Loai_Ma",
                table: "DanhMucDungChungs",
                columns: new[] { "Loai", "Ma" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoanVienNgoaiNgus_DoanVienId",
                table: "DoanVienNgoaiNgus",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_DoanViens_MaNhanVien",
                table: "DoanViens",
                column: "MaNhanVien",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoanViens_MaToCongDoan",
                table: "DoanViens",
                column: "MaToCongDoan");

            migrationBuilder.CreateIndex(
                name: "IX_DoanViens_SoCCCD",
                table: "DoanViens",
                column: "SoCCCD",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DonViCongDoans_MaKhoi",
                table: "DonViCongDoans",
                column: "MaKhoi");

            migrationBuilder.CreateIndex(
                name: "IX_DonViCongDoans_MaParent",
                table: "DonViCongDoans",
                column: "MaParent");

            migrationBuilder.CreateIndex(
                name: "IX_HoatDongCongDoans_DonViId",
                table: "HoatDongCongDoans",
                column: "DonViId");

            migrationBuilder.CreateIndex(
                name: "IX_KhoiChuyenMons_TenKhoi",
                table: "KhoiChuyenMons",
                column: "TenKhoi",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_LichSuBienDongs_DenToCongDoanId",
                table: "LichSuBienDongs",
                column: "DenToCongDoanId");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuBienDongs_DoanVienId",
                table: "LichSuBienDongs",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_LichSuBienDongs_TuToCongDoanId",
                table: "LichSuBienDongs",
                column: "TuToCongDoanId");

            migrationBuilder.CreateIndex(
                name: "IX_PhucLoiDoanViens_DoanVienId",
                table: "PhucLoiDoanViens",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_PhucLoiDoanViens_DonViId",
                table: "PhucLoiDoanViens",
                column: "DonViId");

            migrationBuilder.CreateIndex(
                name: "IX_SangKiens_DoanVienId",
                table: "SangKiens",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_SangKiens_DonViId",
                table: "SangKiens",
                column: "DonViId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiChinhCongDoans_DoanVienId",
                table: "TaiChinhCongDoans",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiChinhCongDoans_DonViId",
                table: "TaiChinhCongDoans",
                column: "DonViId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiKhoans_OrganizationId",
                table: "TaiKhoans",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_TaiKhoans_Username",
                table: "TaiKhoans",
                column: "Username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ThiDuaCongDoans_DoanVienId",
                table: "ThiDuaCongDoans",
                column: "DoanVienId");

            migrationBuilder.CreateIndex(
                name: "IX_ThiDuaCongDoans_DonViId",
                table: "ThiDuaCongDoans",
                column: "DonViId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "DanhMucDungChungs");

            migrationBuilder.DropTable(
                name: "DoanVienNgoaiNgus");

            migrationBuilder.DropTable(
                name: "HoatDongCongDoans");

            migrationBuilder.DropTable(
                name: "LichSuBienDongs");

            migrationBuilder.DropTable(
                name: "PhucLoiDoanViens");

            migrationBuilder.DropTable(
                name: "SangKiens");

            migrationBuilder.DropTable(
                name: "TaiChinhCongDoans");

            migrationBuilder.DropTable(
                name: "TaiKhoans");

            migrationBuilder.DropTable(
                name: "ThiDuaCongDoans");

            migrationBuilder.DropTable(
                name: "DoanViens");

            migrationBuilder.DropTable(
                name: "DonViCongDoans");

            migrationBuilder.DropTable(
                name: "KhoiChuyenMons");
        }
    }
}
