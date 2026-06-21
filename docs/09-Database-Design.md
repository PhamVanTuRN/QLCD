# 09. DATABASE DESIGN - THIẾT KẾ CƠ SỞ DỮ LIỆU HOÀN CHỈNH

Tài liệu này trình bày thiết kế chi tiết cơ sở dữ liệu hệ thống QLCD đảm bảo đầy đủ các mối quan hệ thực thể, ràng buộc kiểm tra và hỗ trợ cơ chế Soft Delete, Audit Log.

## 1. Sơ đồ Quan hệ Thực thể (Physical ERD Diagram)

```mermaid
erDiagram
    KhoiChuyenMon ||--o{ DonViCongDoan : "phân loại"
    DonViCongDoan ||--o{ DonViCongDoan : "chứa"
    DonViCongDoan ||--o{ DoanVien : "quản lý"
    DoanVien ||--o{ DoanVienNgoaiNgu : "có nhiều"
    DoanVien ||--o{ LichSuBienDong : "lưu vết"
    DoanVien ||--o{ HoatDongThamGia : "tham gia"
    HoatDongCongDoan ||--o{ HoatDongThamGia : "bao gồm"
    DoanVien ||--o{ PhucLoiThoai : "đề xuất"
    DoanVien ||--o{ SangKien : "sáng chế"
    DoanVien ||--o{ DiemThiDua : "chấm điểm"

    KhoiChuyenMon {
        Guid Id PK
        String TenKhoi UK
    }

    DonViCongDoan {
        Guid Id PK
        String TenDonVi
        Int LoaiToChuc
        Int Level
        Guid MaParent FK
        Guid MaKhoi FK
        Int TrangThai
        Boolean IsDeleted
    }

    DoanVien {
        Guid Id PK
        String HoTen
        Date NgaySinh
        Int GioiTinh
        String SoCCCD UK
        String DienThoai
        String Email
        String MaNhanVien UK
        Int QuanHam
        Int LoaiCanBo
        Guid MaToCongDoan FK
        Int VaiTro
        Int TrangThai
        String TrinhDoHocVan
        Boolean DangVien
        Boolean IsDeleted
    }

    DoanVienNgoaiNgu {
        Guid Id PK
        Guid DoanVienId FK
        Int NgoaiNgu
        String TrinhDo
        Decimal DiemSo
        Date NgayCap
        String FileChungChiUrl
        Date NgayHetHan
    }

    LichSuBienDong {
        Guid Id PK
        Guid DoanVienId FK
        Int LoaiBienDong
        Guid TuToCongDoanId FK
        Guid DenToCongDoanId FK
        String LyDo
        Date NgayHieuLuc
        Guid NguoiThucHienId
        String FileMinhChungUrl
    }
```

## 2. Các bảng bổ sung phục vụ hệ thống nghiệp vụ hoàn chỉnh

### Bảng `AuditLog` (Ghi vết thay đổi dữ liệu)
* `Id` (Guid, PK)
* `EntityName` (Varchar(100), Tên bảng thay đổi)
* `RecordId` (Guid, ID của dòng dữ liệu)
* `Action` (Varchar(20), INSERT / UPDATE / DELETE)
* `OldValues` (Nvarchar(max), Định dạng JSON giá trị cũ)
* `NewValues` (Nvarchar(max), Định dạng JSON giá trị mới)
* `UserId` (Guid, ID người thực hiện)
* `Timestamp` (DateTime)

### Bảng `HoatDongCongDoan` (Quản lý hoạt động)
* `Id` (Guid, PK)
* `TenHoatDong` (Nvarchar(250))
* `MoTa` (Nvarchar(1000))
* `TuNgay` (DateTime)
* `DenNgay` (DateTime)
* `DiaDiem` (Nvarchar(250))
* `MaQRCode` (Varchar(100))
* `TrangThai` (Int)
* `IsDeleted` (Boolean)

### Bảng `HoatDongThamGia` (Đăng ký & Điểm danh)
* `Id` (Guid, PK)
* `HoatDongId` (Guid, FK)
* `DoanVienId` (Guid, FK)
* `NgayDangKy` (DateTime)
* `NgayCheckIn` (DateTime, Nullable)
* `HinhThucCheckIn` (Int: Web / QR Code)
* `TrangThai` (Int: Đăng ký / Đã tham gia / Vắng mặt)

### Bảng `PhucLoiThoai` (Quản lý cứu trợ & phúc lợi)
* `Id` (Guid, PK)
* `DoanVienId` (Guid, FK)
* `LoaiPhucLoi` (Int: Hiếu, Hỷ, Ốm đau, Thai sản, Khó khăn...)
* `KinhPhiHoTro` (Decimal(18,2))
* `LyDo` (Nvarchar(500))
* `FileMinhChungUrl` (Varchar(500))
* `TrangThai` (Int: ChoDuyetCDBP / ChoDuyetCDCS / DaDuyet / TuChoi)
* `NgayPheDuyet` (DateTime, Nullable)

### Bảng `SangKien` (Sáng kiến & Nghiên cứu khoa học)
* `Id` (Guid, PK)
* `DoanVienId` (Guid, FK)
* `TenDeTai` (Nvarchar(250))
* `LinhVuc` (Nvarchar(100))
* `HieuQuaKinhTe` (Nvarchar(1000))
* `NgayNghiemThu` (Date, Nullable)
* `TrangThai` (Int: DangNghienCuu / DaApDung / DongYeuCau)

### Bảng `DiemThiDua` (Bảng chấm điểm thi đua trực tuyến)
* `Id` (Guid, PK)
* `DoanVienId` (Guid, FK, Nullable - Nếu chấm điểm cho tập thể thì null)
* `DonViId` (Guid, FK, Nullable - Nếu chấm điểm cho cá nhân thì null)
* `NamHoc` (Int)
* `DiemTuDanhGia` (Decimal(5,2))
* `DiemToXet` (Decimal(5,2))
* `DiemCDBPDuyet` (Decimal(5,2))
* `DiemCDCSDuyet` (Decimal(5,2))
* `XepLoai` (Int: HoanThanhXuatSac / HoanThanhTot / HoanThanh / KhongHoanThanh)
