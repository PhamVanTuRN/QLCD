using System;
using System.Collections.Generic;
using QLCD.Domain.Common;
using QLCD.Domain.Enums;

namespace QLCD.Domain.Entities;

public class DoanVien : BaseEntity
{
    // Thông tin cá nhân
    public required string HoTen { get; set; }
    public DateTime NgaySinh { get; set; }
    public int GioiTinh { get; set; } // 0: Nữ, 1: Nam, 2: Khác
    public string? QueQuan { get; set; }
    public string? DanToc { get; set; }
    public string? TonGiao { get; set; }
    public required string SoCCCD { get; set; } // CCCD hoặc CMT Quân đội
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public string? DiaChiLienHe { get; set; }
    public string? AnhDaiDienUrl { get; set; }

    // Thông tin quân nhân / cán bộ
    public required string MaNhanVien { get; set; }
    public QuanHam? CapBacQuanHam { get; set; }
    public string? ChucVu { get; set; }
    public string? ChucDanhChuyenMon { get; set; }
    public string? DonViCongTac { get; set; }
    public LoaiCanBo LoaiCanBo { get; set; }

    // Thông tin công đoàn
    public Guid MaToCongDoan { get; set; } // Phải liên kết đến 1 Tổ công đoàn cụ thể
    public DateTime NgayVaoCongDoan { get; set; }
    public string? SoTheDoanVien { get; set; }
    public VaiTroCongDoan VaiTro { get; set; } = VaiTroCongDoan.DoanVien;
    public TrangThaiDoanVien TrangThai { get; set; } = TrangThaiDoanVien.DangSinhHoat;

    // Trình độ
    public string? TrinhDoHocVan { get; set; }
    public string? TrinhDoChuyenMon { get; set; }
    public string? HocHam { get; set; }
    public string? HocVi { get; set; }
    public string? ChuyenNganhDaoTao { get; set; }
    public string? TrinhDoLyLuanChinhTri { get; set; }
    public string? TrinhDoQuanLyNhaNuoc { get; set; }
    public string? TrinhDoTinHoc { get; set; }

    // Thông tin gia đình / chính sách
    public string? TinhTrangHonNhan { get; set; }
    public int SoCon { get; set; }
    public bool CoConDuoi16Tuoi { get; set; }
    public bool HoanCanhKhoiKhai { get; set; } // Hoàn cảnh khó khăn
    public bool GiaDinhChinhSach { get; set; }
    public bool LaThuongBinhBenhBinh { get; set; }
    public bool ThanNhanLietSi { get; set; }
    public bool NguoiCoCong { get; set; }
    public bool ONhaCongVu { get; set; }
    public string? NguoiLienHeKhanCap { get; set; }
    public string? DienThoaiLienHeKhanCap { get; set; }

    // Thông tin thống kê
    public bool DangVien { get; set; } = false;
    public string? GhiChu { get; set; }

    // Navigation properties
    public virtual DonViCongDoan? ToCongDoan { get; set; }
    public virtual ICollection<DoanVienNgoaiNgu> DoanVienNgoaiNgus { get; set; } = new List<DoanVienNgoaiNgu>();
    public virtual ICollection<LichSuBienDong> LichSuBienDongs { get; set; } = new List<LichSuBienDong>();
}
