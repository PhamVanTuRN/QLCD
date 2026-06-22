using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Shared.Security;

namespace QLCD.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(QLCDDbContext context)
    {
        // 1. Seed Khối chuyên môn (table KhoiChuyenMon)
        var khoiList = new List<KhoiChuyenMon>();
        if (!await context.KhoiChuyenMons.AnyAsync())
        {
            khoiList = new List<KhoiChuyenMon>
            {
                new() { TenKhoi = "Khối Cơ quan" },
                new() { TenKhoi = "Khối Nội" },
                new() { TenKhoi = "Khối Ngoại" },
                new() { TenKhoi = "Khối Cận lâm sàng" }
            };
            context.KhoiChuyenMons.AddRange(khoiList);
            await context.SaveChangesAsync();
        }
        else
        {
            khoiList = await context.KhoiChuyenMons.ToListAsync();
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

            // Chức vụ chính quyền/chuyên môn
            catalogs.Add(new() { Loai = "ChucVu", Ma = "TRUONG_KHOA", Ten = "Trưởng khoa", ThuTu = 1 });
            catalogs.Add(new() { Loai = "ChucVu", Ma = "PHO_KHOA", Ten = "Phó khoa", ThuTu = 2 });
            catalogs.Add(new() { Loai = "ChucVu", Ma = "BS_DIEU_TRI", Ten = "Bác sĩ điều trị", ThuTu = 3 });
            catalogs.Add(new() { Loai = "ChucVu", Ma = "DD_TRUONG", Ten = "Điều dưỡng trưởng", ThuTu = 4 });
            catalogs.Add(new() { Loai = "ChucVu", Ma = "KTV_TRUONG", Ten = "Kỹ thuật viên trưởng", ThuTu = 5 });
            catalogs.Add(new() { Loai = "ChucVu", Ma = "NHAN_VIEN", Ten = "Nhân viên", ThuTu = 6 });

            // Đơn vị công tác chuyên môn
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "KHOA_TIEU_HOA", Ten = "Khoa Tiêu hóa", ThuTu = 1 });
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "KHOA_TIM_MACH", Ten = "Khoa Tim mạch", ThuTu = 2 });
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "KHOA_DUOC", Ten = "Khoa Dược", ThuTu = 3 });
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "KHOA_KHOP", Ten = "Khoa Khớp", ThuTu = 4 });
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "BAN_GIAM_DOC", Ten = "Ban Giám đốc", ThuTu = 5 });
            catalogs.Add(new() { Loai = "DonViCongTac", Ma = "KHOA_CAP_CUU", Ten = "Khoa Cấp cứu", ThuTu = 6 });

            // Chuyên môn nghiệp vụ
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "BAC_SI", Ten = "Bác sĩ", ThuTu = 1 });
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "DUOC_SI", Ten = "Dược sĩ", ThuTu = 2 });
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "DIEU_DUONG", Ten = "Điều dưỡng", ThuTu = 3 });
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "KY_THUAT_VIEN", Ten = "Kỹ thuật viên", ThuTu = 4 });
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "CU_NHAN", Ten = "Cử nhân", ThuTu = 5 });
            catalogs.Add(new() { Loai = "ChuyenMon", Ma = "KHAC", Ten = "Khác", ThuTu = 6 });

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

        // 3. Seed Công đoàn cơ sở Bệnh viện (Root unit)
        var rootId = Guid.Parse("80bf50f3-8799-4e36-8a27-027152f84971");
        var hasCdcs = await context.DonViCongDoans.AnyAsync(u => u.Id == rootId);
        if (!hasCdcs)
        {
            var root = new DonViCongDoan
            {
                Id = rootId,
                TenDonVi = "Công đoàn cơ sở Bệnh viện",
                LoaiToChuc = LoaiToChuc.CDCS,
                Level = 1,
                MaParent = null,
                TrangThai = 1
            };
            context.DonViCongDoans.Add(root);
            await context.SaveChangesAsync();
        }

        // Seed các đơn vị cấp dưới nếu chưa có
        var cdbpNoiId = Guid.Parse("70967e9e-a3c3-4486-9cb0-65d150382d94");
        var cdbpNgoaiId = Guid.Parse("d6e077b4-fd1b-49cc-ae92-32014b418b4c");
        var cdbpLienCoQuanId = Guid.Parse("ccad961d-41db-4321-95c9-d317b6e4a93d");
        
        var tcdTieuHoaId = Guid.Parse("e4c7ade7-5f37-4251-93a8-e1d1fac075a5");
        var tcdTimMachId = Guid.Parse("7eac30bc-d030-42a9-867e-4362adf0ab25");
        var tcdChinhHinhId = Guid.Parse("af968456-75da-4065-8150-6143ef642f18");
        var tcdKhopId = Guid.Parse("31cbec2a-8b49-43b8-9dcc-a4b219992fd4");
        var tcdTrucThuocId = Guid.Parse("5d8e99a5-477f-408e-92e1-76bfb288c260");

        if (!await context.DonViCongDoans.AnyAsync(u => u.Id == cdbpNoiId))
        {
            var cdbpNoi = new DonViCongDoan
            {
                Id = cdbpNoiId,
                TenDonVi = "Khối Nội 1",
                LoaiToChuc = LoaiToChuc.CDBP,
                Level = 2,
                MaParent = rootId,
                TrangThai = 1
            };
            var cdbpNgoai = new DonViCongDoan
            {
                Id = cdbpNgoaiId,
                TenDonVi = "Khối Ngoại Chấn thương",
                LoaiToChuc = LoaiToChuc.CDBP,
                Level = 2,
                MaParent = rootId,
                TrangThai = 1
            };
            var cdbpLienCoQuan = new DonViCongDoan
            {
                Id = cdbpLienCoQuanId,
                TenDonVi = "Liên cơ quan",
                LoaiToChuc = LoaiToChuc.CDBP,
                Level = 2,
                MaParent = rootId,
                TrangThai = 1
            };
            
            context.DonViCongDoans.AddRange(cdbpNoi, cdbpNgoai, cdbpLienCoQuan);
            await context.SaveChangesAsync();
        }

        if (!await context.DonViCongDoans.AnyAsync(u => u.Id == tcdTieuHoaId))
        {
            var tcdTieuHoa = new DonViCongDoan
            {
                Id = tcdTieuHoaId,
                TenDonVi = "Tổ CĐ Khoa Tiêu hóa",
                LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
                Level = 3,
                MaParent = cdbpNoiId,
                TrangThai = 1
            };
            var tcdTimMach = new DonViCongDoan
            {
                Id = tcdTimMachId,
                TenDonVi = "Tổ CĐ Khoa Tim mạch",
                LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
                Level = 3,
                MaParent = cdbpNoiId,
                TrangThai = 1
            };
            var tcdChinhHinh = new DonViCongDoan
            {
                Id = tcdChinhHinhId,
                TenDonVi = "Tổ CĐ Chấn thương chỉnh hình",
                LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
                Level = 3,
                MaParent = cdbpNgoaiId,
                TrangThai = 1
            };
            var tcdKhop = new DonViCongDoan
            {
                Id = tcdKhopId,
                TenDonVi = "Tổ CĐ Khoa Khớp",
                LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
                Level = 3,
                MaParent = cdbpNgoaiId,
                TrangThai = 1
            };
            var tcdTrucThuoc = new DonViCongDoan
            {
                Id = tcdTrucThuocId,
                TenDonVi = "Tổ CĐ trực thuộc CĐCS số 1",
                LoaiToChuc = LoaiToChuc.TO_CD_TRUC_THUOC_CDCS,
                Level = 2,
                MaParent = rootId,
                TrangThai = 1
            };

            context.DonViCongDoans.AddRange(tcdTieuHoa, tcdTimMach, tcdChinhHinh, tcdKhop, tcdTrucThuoc);
            await context.SaveChangesAsync();

            // Seed các đoàn viên mẫu tương ứng với mockMembers
            if (!await context.DoanViens.AnyAsync())
            {
                var members = new List<DoanVien>
                {
                    new()
                    {
                        Id = Guid.Parse("d0c1c90c-4700-4627-a682-00593aa94280"),
                        HoTen = "Trần Quốc Toản",
                        MaNhanVien = "NV-0042",
                        SoCCCD = "001095001234",
                        NgaySinh = new DateTime(1990, 3, 15),
                        GioiTinh = 1,
                        ChucVu = "Phó khoa",
                        DonViCongTac = "Khoa Tiêu hóa",
                        ChucDanhChuyenMon = "Bác sĩ",
                        MaToCongDoan = tcdTieuHoaId,
                        NgayVaoCongDoan = new DateTime(2015, 6, 1),
                        DangVien = true,
                        DienThoai = "0912345678",
                        Email = "toan.tq@bv108.vn",
                        TrinhDoHocVan = "Thạc sĩ",
                        LoaiCanBo = LoaiCanBo.SiQuan,
                        TrangThai = TrangThaiDoanVien.DangSinhHoat
                    },
                    new()
                    {
                        Id = Guid.Parse("04e3fa85-3c8b-43ce-bc98-78ed6cfbac82"),
                        HoTen = "Nguyễn Thị Định",
                        MaNhanVien = "NV-0281",
                        SoCCCD = "001097004321",
                        NgaySinh = new DateTime(1992, 8, 20),
                        GioiTinh = 0,
                        ChucVu = "Điều dưỡng trưởng",
                        DonViCongTac = "Khoa Tiêu hóa",
                        ChucDanhChuyenMon = "Điều dưỡng",
                        MaToCongDoan = tcdTieuHoaId,
                        NgayVaoCongDoan = new DateTime(2016, 1, 15),
                        DangVien = false,
                        DienThoai = "0923456789",
                        Email = "dinh.nt@bv108.vn",
                        TrinhDoHocVan = "Đại học",
                        LoaiCanBo = LoaiCanBo.CongNhanVienChucQuocPhong,
                        TrangThai = TrangThaiDoanVien.DangSinhHoat
                    },
                    new()
                    {
                        Id = Guid.Parse("0a3c7e4f-930f-40b0-a41c-11c482204854"),
                        HoTen = "Phạm Hùng",
                        MaNhanVien = "NV-0985",
                        SoCCCD = "002094002345",
                        NgaySinh = new DateTime(1985, 12, 10),
                        GioiTinh = 1,
                        ChucVu = "Trưởng khoa",
                        DonViCongTac = "Khoa Tim mạch",
                        ChucDanhChuyenMon = "Bác sĩ",
                        MaToCongDoan = tcdTimMachId,
                        NgayVaoCongDoan = new DateTime(2010, 9, 1),
                        DangVien = true,
                        DienThoai = "0934567890",
                        Email = "hung.p@bv108.vn",
                        TrinhDoHocVan = "Tiến sĩ",
                        LoaiCanBo = LoaiCanBo.SiQuan,
                        TrangThai = TrangThaiDoanVien.DangSinhHoat
                    },
                    new()
                    {
                        Id = Guid.Parse("2a442b65-81c7-4adc-8b63-37a91c4e4798"),
                        HoTen = "Hoàng Văn Thái",
                        MaNhanVien = "NV-0120",
                        SoCCCD = "003096009876",
                        NgaySinh = new DateTime(1988, 5, 25),
                        GioiTinh = 1,
                        ChucVu = "Dược sĩ trưởng",
                        DonViCongTac = "Khoa Dược",
                        ChucDanhChuyenMon = "Dược sĩ",
                        MaToCongDoan = tcdTrucThuocId,
                        NgayVaoCongDoan = new DateTime(2014, 3, 1),
                        DangVien = true,
                        DienThoai = "0945678901",
                        Email = "thai.hv@bv108.vn",
                        TrinhDoHocVan = "Thạc sĩ",
                        LoaiCanBo = LoaiCanBo.SiQuan,
                        TrangThai = TrangThaiDoanVien.DangSinhHoat
                    },
                    new()
                    {
                        Id = Guid.Parse("7413cf07-8fdc-4b79-8330-ea41503c013b"),
                        HoTen = "Bùi Thị Xuân",
                        MaNhanVien = "NV-1209",
                        SoCCCD = "004098006543",
                        NgaySinh = new DateTime(1995, 11, 30),
                        GioiTinh = 0,
                        ChucVu = "Điều dưỡng",
                        DonViCongTac = "Khoa Khớp",
                        ChucDanhChuyenMon = "Điều dưỡng",
                        MaToCongDoan = tcdKhopId,
                        NgayVaoCongDoan = new DateTime(2019, 7, 15),
                        DangVien = false,
                        DienThoai = "0956789012",
                        Email = "xuan.bt@bv108.vn",
                        TrinhDoHocVan = "Đại học",
                        LoaiCanBo = LoaiCanBo.LaoDongHopDong,
                        TrangThai = TrangThaiDoanVien.TamDung
                    }
                };

                context.DoanViens.AddRange(members);
                await context.SaveChangesAsync();
            }
        }

        // 4. Seed system accounts (table TaiKhoans)
        if (!await context.TaiKhoans.AnyAsync())
        {
            var adminUser = new TaiKhoan
            {
                Username = "admin",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản trị viên",
                VaiTro = "ADMIN",
                OrganizationId = null,
                PasswordRaw = "admin123",
                TrangThai = true
            };

            var cdcsUser = new TaiKhoan
            {
                Username = "cdcs_benhvien",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Chủ tịch CĐCS",
                VaiTro = "CDCS",
                OrganizationId = rootId,
                PasswordRaw = "admin123",
                TrangThai = true
            };

            context.TaiKhoans.AddRange(adminUser, cdcsUser);

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "cdbp_khoi_noi_1",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Khối Nội 1",
                VaiTro = "CDBP",
                OrganizationId = cdbpNoiId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "cdbp_khoi_ngoai_ct",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Khối Ngoại Chấn thương",
                VaiTro = "CDBP",
                OrganizationId = cdbpNgoaiId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "cdbp_lien_co_quan",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Liên cơ quan",
                VaiTro = "CDBP",
                OrganizationId = cdbpLienCoQuanId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "tocd_tieu_hoa",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Tổ CĐ Khoa Tiêu hóa",
                VaiTro = "TOCD",
                OrganizationId = tcdTieuHoaId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "tocd_tim_mach",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Tổ CĐ Khoa Tim mạch",
                VaiTro = "TOCD",
                OrganizationId = tcdTimMachId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "tocd_chinh_hinh",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Tổ CĐ Chấn thương chỉnh hình",
                VaiTro = "TOCD",
                OrganizationId = tcdChinhHinhId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "tocd_khop",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Tổ CĐ Khoa Khớp",
                VaiTro = "TOCD",
                OrganizationId = tcdKhopId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            context.TaiKhoans.Add(new TaiKhoan
            {
                Username = "tocd_truc_thuoc",
                PasswordHash = PasswordHasher.Hash("admin123"),
                HoTen = "Quản lý Tổ CĐ trực thuộc CĐCS số 1",
                VaiTro = "TOCD",
                OrganizationId = tcdTrucThuocId,
                PasswordRaw = "admin123",
                TrangThai = true
            });

            await context.SaveChangesAsync();
        }
    }
}
