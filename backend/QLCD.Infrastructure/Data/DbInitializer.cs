using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLCD.Domain.Entities;

namespace QLCD.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(QLCDDbContext context)
    {
        // 1. Seed Khối chuyên môn (table KhoiChuyenMon)
        if (!await context.KhoiChuyenMons.AnyAsync())
        {
            var khoiList = new List<KhoiChuyenMon>
            {
                new() { TenKhoi = "Khối Cơ quan" },
                new() { TenKhoi = "Khối Nội" },
                new() { TenKhoi = "Khối Ngoại" },
                new() { TenKhoi = "Khối Cận lâm sàng" }
            };
            context.KhoiChuyenMons.AddRange(khoiList);
            await context.SaveChangesAsync();
        }


        // 2. Seed Danh mục dùng chung (table DanhMucDungChungs)
        if (!await context.DanhMucDungChungs.AnyAsync())
        {
            var catalogs = new List<DanhMucDungChung>();

            // Khối chuyên môn (đồng bộ danh mục)
            catalogs.Add(new() { Loai = "KhoiChuyenMon", Ma = "KHOI_COQUAN", Ten = "Khối Cơ quan", ThuTu = 1 });
            catalogs.Add(new() { Loai = "KhoiChuyenMon", Ma = "KHOI_NOI", Ten = "Khối Nội", ThuTu = 2 });
            catalogs.Add(new() { Loai = "KhoiChuyenMon", Ma = "KHOI_NGOAI", Ten = "Khối Ngoại", ThuTu = 3 });
            catalogs.Add(new() { Loai = "KhoiChuyenMon", Ma = "KHOI_CANLAMSANG", Ten = "Khối Cận lâm sàng", ThuTu = 4 });

            // Loại tổ chức công đoàn
            catalogs.Add(new() { Loai = "LoaiToChuc", Ma = "CDCS", Ten = "Công đoàn cơ sở", ThuTu = 1 });
            catalogs.Add(new() { Loai = "LoaiToChuc", Ma = "CDBP", Ten = "Công đoàn bộ phận", ThuTu = 2 });
            catalogs.Add(new() { Loai = "LoaiToChuc", Ma = "TO_CD_TRUC_THUOC_CDCS", Ten = "Tổ công đoàn trực thuộc CĐCS", ThuTu = 3 });
            catalogs.Add(new() { Loai = "LoaiToChuc", Ma = "TO_CD_THUOC_CDBP", Ten = "Tổ công đoàn thuộc CĐBP", ThuTu = 4 });

            // Cấp tổ chức
            catalogs.Add(new() { Loai = "CapToChuc", Ma = "CAP_1", Ten = "Cấp 1 (Cơ sở)", ThuTu = 1 });
            catalogs.Add(new() { Loai = "CapToChuc", Ma = "CAP_2", Ten = "Cấp 2 (Bộ phận/Trực thuộc)", ThuTu = 2 });
            catalogs.Add(new() { Loai = "CapToChuc", Ma = "CAP_3", Ten = "Cấp 3 (Tổ công đoàn)", ThuTu = 3 });

            // Nhiệm kỳ
            catalogs.Add(new() { Loai = "NhiemKy", Ma = "NK_2023_2028", Ten = "Nhiệm kỳ 2023 - 2028", ThuTu = 1 });
            catalogs.Add(new() { Loai = "NhiemKy", Ma = "NK_2028_2033", Ten = "Nhiệm kỳ 2028 - 2033", ThuTu = 2 });

            // Chức vụ công đoàn
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "CHU_TICH", Ten = "Chủ tịch", ThuTu = 1 });
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "P_CHU_TICH", Ten = "Phó Chủ tịch", ThuTu = 2 });
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "UV_BCH", Ten = "Ủy viên BCH", ThuTu = 3 });
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "TO_TRUONG", Ten = "Tổ trưởng", ThuTu = 4 });
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "TO_PHO", Ten = "Tổ phó", ThuTu = 5 });
            catalogs.Add(new() { Loai = "ChucVuCongDoan", Ma = "DOAN_VIEN", Ten = "Đoàn viên", ThuTu = 6 });

            // Trạng thái đoàn viên
            catalogs.Add(new() { Loai = "TrangThaiDoanVien", Ma = "DANG_SINH_HOAT", Ten = "Đang sinh hoạt", ThuTu = 1 });
            catalogs.Add(new() { Loai = "TrangThaiDoanVien", Ma = "TAM_DUNG", Ten = "Tạm dừng sinh hoạt", ThuTu = 2 });
            catalogs.Add(new() { Loai = "TrangThaiDoanVien", Ma = "CHUYEN_SINH_HOAT", Ten = "Đã chuyển sinh hoạt", ThuTu = 3 });
            catalogs.Add(new() { Loai = "TrangThaiDoanVien", Ma = "DA_NGHI_HUU", Ten = "Đã nghỉ hưu", ThuTu = 4 });

            // Chất lượng đoàn viên
            catalogs.Add(new() { Loai = "ChatLuongDoanVien", Ma = "HOAN_THANH_XUAT_SAC", Ten = "Hoàn thành xuất sắc nhiệm vụ", ThuTu = 1 });
            catalogs.Add(new() { Loai = "ChatLuongDoanVien", Ma = "HOAN_THANH_TOT", Ten = "Hoàn thành tốt nhiệm vụ", ThuTu = 2 });
            catalogs.Add(new() { Loai = "ChatLuongDoanVien", Ma = "HOAN_THANH", Ten = "Hoàn thành nhiệm vụ", ThuTu = 3 });
            catalogs.Add(new() { Loai = "ChatLuongDoanVien", Ma = "KHONG_HOAN_THANH", Ten = "Không hoàn thành nhiệm vụ", ThuTu = 4 });

            // Giới tính
            catalogs.Add(new() { Loai = "GioiTinh", Ma = "NAM", Ten = "Nam", ThuTu = 1 });
            catalogs.Add(new() { Loai = "GioiTinh", Ma = "NU", Ten = "Nữ", ThuTu = 2 });
            catalogs.Add(new() { Loai = "GioiTinh", Ma = "KHAC", Ten = "Khác", ThuTu = 3 });

            // Dân tộc
            catalogs.Add(new() { Loai = "DanToc", Ma = "KINH", Ten = "Kinh", ThuTu = 1 });
            catalogs.Add(new() { Loai = "DanToc", Ma = "TAY", Ten = "Tày", ThuTu = 2 });
            catalogs.Add(new() { Loai = "DanToc", Ma = "THAI", Ten = "Thái", ThuTu = 3 });
            catalogs.Add(new() { Loai = "DanToc", Ma = "MUONG", Ten = "Mường", ThuTu = 4 });
            catalogs.Add(new() { Loai = "DanToc", Ma = "KHAC", Ten = "Khác", ThuTu = 5 });

            // Tôn giáo
            catalogs.Add(new() { Loai = "TonGiao", Ma = "KHONG", Ten = "Không", ThuTu = 1 });
            catalogs.Add(new() { Loai = "TonGiao", Ma = "PHAT_GIAO", Ten = "Phật giáo", ThuTu = 2 });
            catalogs.Add(new() { Loai = "TonGiao", Ma = "THIEN_CHUA", Ten = "Thiên chúa", ThuTu = 3 });
            catalogs.Add(new() { Loai = "TonGiao", Ma = "KHAC", Ten = "Khác", ThuTu = 4 });

            // Trình độ chuyên môn
            catalogs.Add(new() { Loai = "TrinhDoChuyenMon", Ma = "BAC_SI", Ten = "Bác sĩ", ThuTu = 1 });
            catalogs.Add(new() { Loai = "TrinhDoChuyenMon", Ma = "DUOC_SI", Ten = "Dược sĩ", ThuTu = 2 });
            catalogs.Add(new() { Loai = "TrinhDoChuyenMon", Ma = "DIEU_DUONG", Ten = "Điều dưỡng", ThuTu = 3 });
            catalogs.Add(new() { Loai = "TrinhDoChuyenMon", Ma = "KY_THUAT_VIEN", Ten = "Kỹ thuật viên", ThuTu = 4 });
            catalogs.Add(new() { Loai = "TrinhDoChuyenMon", Ma = "CU_NHAN_KHAC", Ten = "Cử nhân khác", ThuTu = 5 });

            // Học hàm học vị
            catalogs.Add(new() { Loai = "HocHamHocVi", Ma = "CU_NHAN", Ten = "Cử nhân", ThuTu = 1 });
            catalogs.Add(new() { Loai = "HocHamHocVi", Ma = "THAC_SI", Ten = "Thạc sĩ", ThuTu = 2 });
            catalogs.Add(new() { Loai = "HocHamHocVi", Ma = "TIEN_SI", Ten = "Tiến sĩ", ThuTu = 3 });
            catalogs.Add(new() { Loai = "HocHamHocVi", Ma = "PHO_GIAO_SU", Ten = "Phó Giáo sư", ThuTu = 4 });
            catalogs.Add(new() { Loai = "HocHamHocVi", Ma = "GIAO_SU", Ten = "Giáo sư", ThuTu = 5 });

            // Ngoại ngữ/Ngôn ngữ
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_ANH", Ten = "Tiếng Anh", ThuTu = 1 });
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_TRUNG", Ten = "Tiếng Trung", ThuTu = 2 });
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_NHAT", Ten = "Tiếng Nhật", ThuTu = 3 });
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_HAN", Ten = "Tiếng Hàn", ThuTu = 4 });
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_PHAP", Ten = "Tiếng Pháp", ThuTu = 5 });
            catalogs.Add(new() { Loai = "NgoaiNgu", Ma = "TIENG_NGA", Ten = "Tiếng Nga", ThuTu = 6 });

            // Trình độ ngoại ngữ
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "A1", Ten = "A1", ThuTu = 1 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "A2", Ten = "A2", ThuTu = 2 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "B1", Ten = "B1", ThuTu = 3 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "B2", Ten = "B2", ThuTu = 4 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "C1", Ten = "C1", ThuTu = 5 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "C2", Ten = "C2", ThuTu = 6 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "CO_BAN", Ten = "Cơ bản", ThuTu = 7 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "KHA", Ten = "Khá", ThuTu = 8 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "TOT", Ten = "Tốt", ThuTu = 9 });
            catalogs.Add(new() { Loai = "TrinhDoNgoaiNgu", Ma = "THANH_THAO", Ten = "Thành thạo", ThuTu = 10 });

            // Loại hoạt động công đoàn
            catalogs.Add(new() { Loai = "LoaiHoatDong", Ma = "PHONG_TRAO", Ten = "Phong trào thi đua", ThuTu = 1 });
            catalogs.Add(new() { Loai = "LoaiHoatDong", Ma = "HOI_THAO", Ten = "Hội thảo / Tọa đàm", ThuTu = 2 });
            catalogs.Add(new() { Loai = "LoaiHoatDong", Ma = "THE_THAO", Ten = "Thể dục thể thao", ThuTu = 3 });
            catalogs.Add(new() { Loai = "LoaiHoatDong", Ma = "VAN_NGHE", Ten = "Văn hóa văn nghệ", ThuTu = 4 });
            catalogs.Add(new() { Loai = "LoaiHoatDong", Ma = "TU_THIEN", Ten = "Từ thiện xã hội", ThuTu = 5 });

            // Loại thu/chi tài chính
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "THU_DOAN_PHI", Ten = "Thu đoàn phí", ThuTu = 1 });
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "THU_CAP_TREN", Ten = "Thu kinh phí cấp trên", ThuTu = 2 });
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "THU_KHAC", Ten = "Thu khác", ThuTu = 3 });
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "CHI_HOAT_DONG", Ten = "Chi hoạt động phong trào", ThuTu = 4 });
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "CHI_PHUC_LOI", Ten = "Chi thăm hỏi phúc lợi", ThuTu = 5 });
            catalogs.Add(new() { Loai = "LoaiThuChi", Ma = "CHI_KHAC", Ten = "Chi khác", ThuTu = 6 });

            // Loại đoàn phí
            catalogs.Add(new() { Loai = "LoaiDoanPhi", Ma = "DOAN_PHI_HANG_THANG", Ten = "Đoàn phí đóng hàng tháng", ThuTu = 1 });

            // Hình thức phúc lợi, cứu trợ
            catalogs.Add(new() { Loai = "HinhThucPhucLoi", Ma = "OM_DAU", Ten = "Thăm hỏi ốm đau", ThuTu = 1 });
            catalogs.Add(new() { Loai = "HinhThucPhucLoi", Ma = "HIEU", Ten = "Viếng hiếu", ThuTu = 2 });
            catalogs.Add(new() { Loai = "HinhThucPhucLoi", Ma = "HY", Ten = "Chúc mừng hỷ", ThuTu = 3 });
            catalogs.Add(new() { Loai = "HinhThucPhucLoi", Ma = "THAI_SAN", Ten = "Trợ cấp thai sản", ThuTu = 4 });
            catalogs.Add(new() { Loai = "HinhThucPhucLoi", Ma = "THIEN_TAI", Ten = "Cứu trợ thiên tai/Khó khăn", ThuTu = 5 });

            // Loại sáng kiến, đề tài
            catalogs.Add(new() { Loai = "LoaiSangKien", Ma = "CAP_CO_SO", Ten = "Sáng kiến cấp Cơ sở", ThuTu = 1 });
            catalogs.Add(new() { Loai = "LoaiSangKien", Ma = "CAP_VIEN", Ten = "Đề tài cấp Bệnh viện", ThuTu = 2 });
            catalogs.Add(new() { Loai = "LoaiSangKien", Ma = "CAP_BO", Ten = "Đề tài cấp Bộ", ThuTu = 3 });

            // Cấp thi đua
            catalogs.Add(new() { Loai = "CapThiDua", Ma = "CAP_TO", Ten = "Cấp Tổ công đoàn", ThuTu = 1 });
            catalogs.Add(new() { Loai = "CapThiDua", Ma = "CAP_KHOI", Ten = "Cấp Khối", ThuTu = 2 });
            catalogs.Add(new() { Loai = "CapThiDua", Ma = "CAP_BENH_VIEN", Ten = "Cấp Bệnh viện", ThuTu = 3 });

            // Hình thức khen thưởng
            catalogs.Add(new() { Loai = "HinhThucKhenThuong", Ma = "GIAY_KHEN", Ten = "Giấy khen", ThuTu = 1 });
            catalogs.Add(new() { Loai = "HinhThucKhenThuong", Ma = "BANG_KHEN", Ten = "Bằng khen", ThuTu = 2 });
            catalogs.Add(new() { Loai = "HinhThucKhenThuong", Ma = "CHIEN_SI_THI_DUA", Ten = "Chiến sĩ thi đua", ThuTu = 3 });

            // Hình thức kỷ luật
            catalogs.Add(new() { Loai = "HinhThucKyLuat", Ma = "KHIEN_TRACH", Ten = "Khiển trách", ThuTu = 1 });
            catalogs.Add(new() { Loai = "HinhThucKyLuat", Ma = "CANH_CAO", Ten = "Cảnh cáo", ThuTu = 2 });

            // Loại văn bản
            catalogs.Add(new() { Loai = "LoaiVanBan", Ma = "CONG_VAN_DEN", Ten = "Công văn đến", ThuTu = 1 });
            catalogs.Add(new() { Loai = "LoaiVanBan", Ma = "CONG_VAN_DI", Ten = "Công văn đi", ThuTu = 2 });
            catalogs.Add(new() { Loai = "LoaiVanBan", Ma = "QUYET_DINH", Ten = "Quyết định", ThuTu = 3 });
            catalogs.Add(new() { Loai = "LoaiVanBan", Ma = "TAI_LIEU_NOI_BO", Ten = "Tài liệu nội bộ", ThuTu = 4 });

            context.DanhMucDungChungs.AddRange(catalogs);
            await context.SaveChangesAsync();
        }
    }
}
