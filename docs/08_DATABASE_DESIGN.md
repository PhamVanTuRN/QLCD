# 08. DATABASE DESIGN - THIẾT KẾ CƠ SỞ DỮ LIỆU TOÀN DIỆN

Tài liệu này đặc tả chi tiết thiết kế cơ sở dữ liệu vật lý (Physical Schema) và các lớp C# Entity tương ứng cho Hệ thống Quản lý Công đoàn Bệnh viện TWQĐ 108.

---

## I. MÔ HÌNH THIẾT KẾ BẢNG (12 BẢNG NGHIỆP VỤ)

### 1. Bảng Tổ chức Công đoàn (`DonViCongDoan`)
* **Khóa chính**: `Id` (Guid)
* **Chỉ mục (Indexes)**: Non-clustered index trên `MaParent` và `LoaiToChuc`.
* **Soft Delete**: `IsDeleted` (Bit)
* **Audit Fields**: `CreatedDate`, `CreatedBy`, `UpdatedDate`, `UpdatedBy`.

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính tự sinh |
| `TenDonVi` | Nvarchar(150) | Not Null | Tên đơn vị công đoàn |
| `LoaiToChuc` | Int | Not Null | Enum: CDCS(1), CDBP(2), v.v. |
| `Level` | Int | Not Null | Cấp tổ chức (1, 2, 3) |
| `MaParent` | UniqueIdentifier | Nullable FK | Liên kết đến đơn vị cha |
| `MaKhoi` | UniqueIdentifier | Nullable FK | Liên kết khối chuyên môn |
| `TrangThai` | Int | Not Null | 1: Hoạt động, 0: Ngừng |

---

### 2. Bảng Đoàn viên (`DoanVien`)
* **Khóa chính**: `Id` (Guid)
* **Chỉ mục (Indexes)**: Unique index trên `SoCCCD`, Unique index trên `MaNhanVien`, Non-clustered index trên `MaToCongDoan`.

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `HoTen` | Nvarchar(100) | Not Null | Họ và tên đoàn viên |
| `NgaySinh` | Date | Not Null | Ngày sinh |
| `GioiTinh` | Int | Not Null | 0: Nữ, 1: Nam |
| `QueQuan` | Nvarchar(250) | Null | Quê quán |
| `SoCCCD` | Varchar(12) | Unique, Not Null | CCCD hoặc CMT Quân đội |
| `DienThoai` | Varchar(15) | Null | Số điện thoại di động |
| `Email` | Varchar(100) | Null | Email cá nhân hoặc cơ quan |
| `MaNhanVien` | Varchar(20) | Unique, Not Null | Mã nhân viên bệnh viện |
| `CapBacQuanHam`| Int | Null | Enum cấp quân hàm |
| `LoaiCanBo` | Int | Not Null | Sĩ quan, QNCN, CNVQP... |
| `MaToCongDoan` | UniqueIdentifier | FK | Liên kết Tổ công đoàn |
| `NgayVaoCongDoan`| Date | Not Null | Ngày gia nhập |
| `SoTheDoanVien`| Varchar(30) | Null | Số thẻ công đoàn |
| `VaiTro` | Int | Not Null | Vai trò Ban chấp hành |
| `TrangThai` | Int | Not Null | 1: Đang sinh hoạt, 2: Tạm dừng... |

---

### 3. Bảng Ngoại ngữ Đoàn viên (`DoanVienNgoaiNgu`)
* **Khóa chính**: `Id` (Guid)
* **Khóa ngoại**: `DoanVienId` liên kết bảng `DoanVien` (Cascade delete).

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK | Liên kết đoàn viên |
| `NgoaiNgu` | Varchar(50) | Not Null | Tiếng Anh, Tiếng Nhật, v.v. |
| `TrinhDo` | Varchar(50) | Not Null | IELTS, TOEIC, Khung VN... |
| `DiemSo` | Decimal(5,1) | Not Null | Điểm số đạt được |
| `NgayCap` | Date | Not Null | Ngày cấp chứng chỉ |
| `DonViCap` | Nvarchar(150) | Null | Đơn vị cấp chứng chỉ |
| `FileChungChiUrl`| Varchar(500) | Null | Đường dẫn file minh chứng |

---

### 4. Bảng Trình độ Đoàn viên (`DoanVienTrinhDo`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK, Unique | Liên kết 1-1 với DoanVien |
| `TrinhDoHocVan`| Nvarchar(100) | Not Null | Trình độ học vấn |
| `TrinhDoChuyenMon`| Nvarchar(100) | Not Null | Bác sĩ, Dược sĩ, Điều dưỡng... |
| `HocHam` | Nvarchar(50) | Null | Giáo sư, Phó giáo sư |
| `HocVi` | Nvarchar(50) | Null | Tiến sĩ, Thạc sĩ |
| `ChuyenNganh` | Nvarchar(100) | Null | Chuyên ngành đào tạo |
| `LyLuanChinhTri`| Nvarchar(100) | Null | Cử nhân, Cao cấp, Trung cấp |

---

### 5. Bảng Biến động Đoàn viên (`LichSuBienDong`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK | Đoàn viên phát sinh biến động |
| `LoaiBienDong` | Int | Not Null | Enum 9 loại biến động |
| `TuToCongDoanId`| UniqueIdentifier | Nullable FK | Tổ công đoàn xuất phát |
| `DenToCongDoanId`| UniqueIdentifier | Nullable FK | Tổ công đoàn chuyển đến |
| `LyDo` | Nvarchar(500) | Not Null | Lý do biến động |
| `NgayHieuLuc` | Date | Not Null | Ngày quyết định có hiệu lực |
| `FileMinhChungUrl`| Varchar(500) | Null | File quyết định đính kèm |

---

### 6. Bảng Hoạt động Công đoàn (`HoatDongCongDoan`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `TenHoatDong` | Nvarchar(250) | Not Null | Tên sự kiện hoạt động |
| `MoTa` | Nvarchar(1000) | Null | Nội dung chi tiết |
| `TuNgay` | DateTime | Not Null | Thời gian bắt đầu |
| `DenNgay` | DateTime | Not Null | Thời gian kết thúc |
| `DiaDiem` | Nvarchar(250) | Not Null | Địa điểm tổ chức |
| `MaQRCode` | Varchar(100) | Null | Mã token điểm danh QR |

---

### 7. Bảng Tài chính Công đoàn (`TaiChinhCongDoan`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DonViId` | UniqueIdentifier | FK | Đơn vị phát sinh thu/chi |
| `LoaiGiaoDich` | Int | Not Null | 1: Thu đoàn phí, 2: Chi hoạt động... |
| `SoTien` | Decimal(18,2) | Not Null | Số tiền giao dịch |
| `NgayGiaoDich` | DateTime | Not Null | Ngày ghi nhận dòng tiền |
| `NguoiGiaoDich`| Nvarchar(100) | Not Null | Người thực hiện |
| `GhiChu` | Nvarchar(500) | Null | Chi tiết nội dung giao dịch |

---

### 8. Bảng Phúc lợi & Hỗ trợ (`PhucLoiDoanVien`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK | Đoàn viên thụ hưởng phúc lợi |
| `LoaiPhucLoi` | Int | Not Null | Hiếu, Hỷ, Ốm đau, Thai sản... |
| `KinhPhiHoTro` | Decimal(18,2) | Not Null | Mức chi hỗ trợ |
| `LyDo` | Nvarchar(500) | Not Null | Lý do đề xuất cứu trợ |
| `TrangThai` | Int | Not Null | Trạng thái phê duyệt (1-4) |
| `FileMinhChungUrl`| Varchar(500) | Null | Hóa đơn viện phí, quyết định |

---

### 9. Bảng Khen thưởng / Kỷ luật (`KhenThuongKyLuat`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK | Cá nhân chịu quyết định |
| `LoaiHinh` | Int | Not Null | 1: Khen thưởng, 2: Kỷ luật |
| `HinhThuc` | Nvarchar(150) | Not Null | Giấy khen, khiển trách, cảnh cáo... |
| `SoQuyetDinh` | Varchar(50) | Not Null | Số hiệu quyết định ký |
| `NgayQuyetDinh`| Date | Not Null | Ngày ký quyết định |
| `NoiDung` | Nvarchar(1000) | Not Null | Thành tích hoặc lỗi vi phạm |
| `HieuLucDen` | Date | Null | Thời hạn hết hiệu lực kỷ luật |

---

### 10. Bảng Sáng kiến & Đề tài (`SangKien`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | FK | Đoàn viên đăng ký chủ trì |
| `TenDeTai` | Nvarchar(250) | Not Null | Tên sáng kiến, đề tài khoa học |
| `LinhVuc` | Nvarchar(100) | Not Null | Y học lâm sàng, quản lý y tế... |
| `HieuQuaKinhTe`| Nvarchar(1000) | Null | Giá trị làm lợi, hiệu quả xã hội |
| `NgayNghiemThu`| Date | Null | Ngày hội đồng nghiệm thu thông qua |
| `TrangThai` | Int | Not Null | Trạng thái đề tài |

---

### 11. Bảng Thi đua Công đoàn (`ThiDuaCongDoan`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `DoanVienId` | UniqueIdentifier | Nullable FK | Phục vụ bình xét cá nhân |
| `DonViId` | UniqueIdentifier | Nullable FK | Phục vụ bình xét tập thể |
| `NamHoc` | Int | Not Null | Năm học / Năm thi đua bình xét |
| `DiemTuDanhGia`| Decimal(5,2) | Not Null | Điểm tự chấm |
| `DiemBchDuyet` | Decimal(5,2) | Not Null | Điểm Hội đồng thi đua chốt |
| `XepLoai` | Int | Not Null | Xuất sắc, Tốt, Hoàn thành... |

---

### 12. Bảng Văn bản & Tài liệu (`VanBanTaiLieu`)
* **Khóa chính**: `Id` (Guid)

| Tên Cột | Kiểu Dữ Liệu | Ràng buộc | Mô Tả |
| :--- | :--- | :--- | :--- |
| `Id` | UniqueIdentifier | PK | Khóa chính |
| `SoKyHieu` | Varchar(50) | Not Null | Số ký hiệu công văn |
| `LoaiVanBan` | Int | Not Null | 1: Đến, 2: Đi, 3: Thư viện nội bộ |
| `CoQuanBanHanh`| Nvarchar(150) | Not Null | Nơi ban hành văn bản |
| `TrichYeu` | Nvarchar(500) | Not Null | Tóm tắt nội dung văn bản |
| `FileDinhKemUrl`| Varchar(500) | Not Null | File scan văn bản hệ thống |

---

## II. ĐỀ XUẤT C# ENTITY TƯƠNG ỨNG

Dưới đây là mã nguồn C# định nghĩa các Entity tương ứng đặt tại dự án `QLCD.Domain`.

```csharp
// 1. DonViCongDoan.cs
public class DonViCongDoan : BaseEntity
{
    public required string TenDonVi { get; set; }
    public LoaiToChuc LoaiToChuc { get; set; }
    public int Level { get; set; }
    public Guid? MaParent { get; set; }
    public Guid? MaKhoi { get; set; }
    public int TrangThai { get; set; }
    
    public virtual DonViCongDoan? Parent { get; set; }
    public virtual ICollection<DonViCongDoan> Children { get; set; } = new List<DonViCongDoan>();
}

// 2. DoanVien.cs
public class DoanVien : BaseEntity
{
    public required string HoTen { get; set; }
    public DateTime NgaySinh { get; set; }
    public int GioiTinh { get; set; }
    public string? QueQuan { get; set; }
    public string? DanToc { get; set; }
    public string? TonGiao { get; set; }
    public required string SoCCCD { get; set; }
    public string? DienThoai { get; set; }
    public string? Email { get; set; }
    public required string MaNhanVien { get; set; }
    public QuanHam? CapBacQuanHam { get; set; }
    public string? ChucVu { get; set; }
    public string? ChucDanhChuyenMon { get; set; }
    public string? DonViCongTac { get; set; }
    public LoaiCanBo LoaiCanBo { get; set; }
    public Guid MaToCongDoan { get; set; }
    public DateTime NgayVaoCongDoan { get; set; }
    public string? SoTheDoanVien { get; set; }
    public VaiTroCongDoan VaiTro { get; set; }
    public TrangThaiDoanVien TrangThai { get; set; }
    
    public virtual DonViCongDoan? ToCongDoan { get; set; }
    public virtual DoanVienTrinhDo? TrinhDo { get; set; }
    public virtual ICollection<DoanVienNgoaiNgu> NgoaiNgus { get; set; } = new List<DoanVienNgoaiNgu>();
}

// 3. DoanVienNgoaiNgu.cs
public class DoanVienNgoaiNgu : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public required string NgoaiNgu { get; set; }
    public required string TrinhDo { get; set; }
    public decimal DiemSo { get; set; }
    public DateTime NgayCap { get; set; }
    public string? DonViCap { get; set; }
    public string? FileChungChiUrl { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 4. DoanVienTrinhDo.cs
public class DoanVienTrinhDo : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public required string TrinhDoHocVan { get; set; }
    public required string TrinhDoChuyenMon { get; set; }
    public string? HocHam { get; set; }
    public string? HocVi { get; set; }
    public string? ChuyenNganh { get; set; }
    public string? TrinhDoLyLuanChinhTri { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 5. LichSuBienDong.cs
public class LichSuBienDong : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public LoaiBienDong LoaiBienDong { get; set; }
    public Guid? TuToCongDoanId { get; set; }
    public Guid? DenToCongDoanId { get; set; }
    public required string LyDo { get; set; }
    public DateTime NgayHieuLuc { get; set; }
    public string? FileMinhChungUrl { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 6. HoatDongCongDoan.cs
public class HoatDongCongDoan : BaseEntity
{
    public required string TenHoatDong { get; set; }
    public string? MoTa { get; set; }
    public DateTime TuNgay { get; set; }
    public DateTime DenNgay { get; set; }
    public required string DiaDiem { get; set; }
    public string? MaQRCode { get; set; }
}

// 7. TaiChinhCongDoan.cs
public class TaiChinhCongDoan : BaseEntity
{
    public Guid DonViId { get; set; }
    public int LoaiGiaoDich { get; set; }
    public decimal SoTien { get; set; }
    public DateTime NgayGiaoDich { get; set; }
    public required string NguoiGiaoDich { get; set; }
    public string? GhiChu { get; set; }
}

// 8. PhucLoiDoanVien.cs
public class PhucLoiDoanVien : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public int LoaiPhucLoi { get; set; }
    public decimal KinhPhiHoTro { get; set; }
    public required string LyDo { get; set; }
    public int TrangThai { get; set; }
    public string? FileMinhChungUrl { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 9. KhenThuongKyLuat.cs
public class KhenThuongKyLuat : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public int LoaiHinh { get; set; } // Khen thuong / Ky luat
    public required string HinhThuc { get; set; }
    public required string SoQuyetDinh { get; set; }
    public DateTime NgayQuyetDinh { get; set; }
    public required string NoiDung { get; set; }
    public DateTime? HieuLucDen { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 10. SangKien.cs
public class SangKien : BaseEntity
{
    public Guid DoanVienId { get; set; }
    public required string TenDeTai { get; set; }
    public required string LinhVuc { get; set; }
    public string? HieuQuaKinhTe { get; set; }
    public DateTime? NgayNghiemThu { get; set; }
    public int TrangThai { get; set; }
    
    public virtual DoanVien? DoanVien { get; set; }
}

// 11. ThiDuaCongDoan.cs
public class ThiDuaCongDoan : BaseEntity
{
    public Guid? DoanVienId { get; set; }
    public Guid? DonViId { get; set; }
    public int NamHoc { get; set; }
    public decimal DiemTuDanhGia { get; set; }
    public decimal DiemBchDuyet { get; set; }
    public int XepLoai { get; set; }
}

// 12. VanBanTaiLieu.cs
public class VanBanTaiLieu : BaseEntity
{
    public required string SoKyHieu { get; set; }
    public int LoaiVanBan { get; set; }
    public required string CoQuanBanHanh { get; set; }
    public required string TrichYeu { get; set; }
    public required string FileDinhKemUrl { get; set; }
}
```
