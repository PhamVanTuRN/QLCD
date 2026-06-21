# 04. DATA DICTIONARY - TỪ ĐIỂN DỮ LIỆU CHỈNH SỬA

Tài liệu này đặc tả chi tiết cấu trúc thuộc tính của các thực thể cốt lõi trong hệ thống QLCD.

## 1. Thực thể: Đơn vị Công đoàn (`DonViCongDoan`)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `Id` | Guid | PK | Khóa chính |
| `TenDonVi` | Nvarchar(150) | Not Null | Tên đơn vị công đoàn |
| `LoaiToChuc`| Enum (Int) | Not Null | `CDCS` (1), `CDBP` (2), `TO_CD_TRUC_THUOC_CDCS` (3), `TO_CD_THUOC_CDBP` (4) |
| `Level` | Int | Not Null | Cấp tổ chức (1, 2, 3) |
| `MaParent` | Guid | Nullable FK | Liên kết đến `DonViCongDoan` cha |
| `MaKhoi` | Guid | Nullable FK | Liên kết đến danh mục `KhoiChuyenMon` |
| `TrangThai` | Int | Not Null | `DangHoatDong` (1), `NgungHoatDong` (0) |
| `IsDeleted` | Bit | Not Null | Đánh dấu xóa mềm (Soft Delete) |

## 2. Thực thể: Đoàn viên (`DoanVien`)
| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
| :--- | :--- | :--- | :--- |
| `Id` | Guid | PK | Khóa chính |
| `HoTen` | Nvarchar(100) | Not Null | Họ và tên |
| `NgaySinh` | Date | Not Null | Ngày sinh |
| `GioiTinh` | Int | Not Null | 0: Nữ, 1: Nam |
| `QueQuan` | Nvarchar(250) | Not Null | Quê quán |
| `SoCCCD` | Varchar(12) | Unique | Số Căn cước công dân / CMT Quân đội |
| `DienThoai` | Varchar(15) | Not Null | Số điện thoại |
| `Email` | Varchar(100) | Not Null | Địa chỉ email |
| `MaNhanVien` | Varchar(20) | Unique | Mã nhân viên bệnh viện |
| `QuanHam` | Int | Nullable | Cấp bậc quân hàm (Enum) |
| `LoaiCanBo` | Int | Not Null | Sĩ quan, QNCN, CNVQP, Hợp đồng... |
| `MaToCongDoan`| Guid | FK | Phải thuộc một Tổ Công đoàn (Level 3 hoặc Tổ trực thuộc CĐCS) |
| `VaiTro` | Int | Not Null | Đoàn viên, Tổ trưởng, Chủ tịch CĐBP, Ủy viên BCH... |
| `TrangThai` | Int | Not Null | Đang sinh hoạt, Chuyển đi, Nghỉ hưu, Tạm dừng... |
| `TrinhDoHocVan`| Nvarchar(100)| Not Null | Trình độ học vấn |
| `DangVien` | Bit | Not Null | Đã kết nạp Đảng hay chưa |

## 3. Thực thể: Trình độ Ngoại ngữ Đoàn viên (`DoanVienNgoaiNgu`)
Lưu trữ thông tin đa ngoại ngữ của đoàn viên.
* `Id` (Guid, PK)
* `DoanVienId` (Guid, FK liên kết `DoanVien`)
* `NgoaiNgu` (Enum/Int: Tiếng Anh, Nga, Pháp, Trung, Đức, Nhật, Hàn, Khác)
* `TrinhDo` (Nvarchar(50), Ví dụ: IELTS, TOEIC, B1, B2)
* `DiemSo` (Decimal(5,1))
* `NgayCap` (Date)
* `FileChungChiUrl` (Varchar(500))
* `NgayHetHan` (Date, Nullable)
