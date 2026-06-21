# 04. DATA DICTIONARY - TỪ ĐIỂN DỮ LIỆU

Tài liệu này mô tả chi tiết các thuộc tính dữ liệu cốt lõi được sử dụng trong Hệ thống QLCD.

## 1. Thực thể: Đoàn viên (DoanVien / UnionMember)
Mô tả thông tin chi tiết của từng đoàn viên công đoàn bệnh viện.

| Tên Thuộc Tính | Kiểu Dữ Liệu | Độ Rộng | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | Guid | | Có | Khóa chính tự sinh |
| `MaDoanVien` | Varchar | 20 | Có | Mã định danh duy nhất (Ví dụ: DV-108-XXXX) |
| `HoTen` | Nvarchar | 100 | Có | Họ và tên đoàn viên |
| `NgaySinh` | Date | | Có | Ngày tháng năm sinh |
| `GioiTinh` | Int | | Có | 0: Nữ, 1: Nam, 2: Khác |
| `SoCCCD` | Varchar | 12 | Có | Số Căn cước công dân |
| `SoDienThoai` | Varchar | 15 | Có | Số điện thoại liên lạc |
| `Email` | Varchar | 100 | Không | Địa chỉ thư điện tử cá nhân hoặc bệnh viện |
| `MaToCongDoan`| Guid | | Có | Khóa ngoại liên kết bảng Tổ Công đoàn |
| `ChucVuCongDoan`| Int | | Có | 0: Đoàn viên, 1: Tổ trưởng, 2: BCH CĐBP, 3: BCH CĐCS |
| `ChucVuChuyenMon`| Nvarchar| 100 | Không | Bác sĩ, Điều dưỡng, Dược sĩ, Nhân viên hành chính... |
| `NgayVaoCongDoan`| Date | | Có | Ngày ký quyết định kết nạp |
| `TrangThai` | Int | | Có | 0: Đang hoạt động, 1: Miễn sinh hoạt, 2: Đã ra khỏi công đoàn |

## 2. Thực thể: Đơn vị Công đoàn (DonViCongDoan / UnionUnit)
Mô tả cấu trúc tổ chức 3 cấp của công đoàn bệnh viện.

| Tên Thuộc Tính | Kiểu Dữ Liệu | Độ Rộng | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | Guid | | Có | Khóa chính |
| `MaDonVi` | Varchar | 20 | Có | Mã đơn vị (CĐCS-108, CDBP-NOI1, TCD-TIEUHOA...) |
| `TenDonVi` | Nvarchar | 150 | Có | Tên đơn vị công đoàn |
| `CapDonVi` | Int | | Có | 1: CĐCS, 2: CĐBP, 3: Tổ công đoàn |
| `MaDonViCha` | Guid | | Không | Khóa ngoại tự tham chiếu (Null đối với cấp CĐCS) |
| `NguoiDaiDienId`| Guid | | Không | Khóa ngoại liên kết bảng DoanVien (Chủ tịch/Tổ trưởng) |

## 3. Thực thể: Đóng Đoàn phí (DongDoanPhi / UnionFeePayment)
Lưu trữ thông tin lịch sử đóng đoàn phí của từng đoàn viên.

| Tên Thuộc Tính | Kiểu Dữ Liệu | Độ Rộng | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | Guid | | Có | Khóa chính |
| `DoanVienId` | Guid | | Có | Khóa ngoại liên kết bảng DoanVien |
| `ThangDong` | Int | | Có | Tháng thu phí (1 - 12) |
| `NamDong` | Int | | Có | Năm thu phí |
| `SoTien` | Decimal | (18,2) | Có | Số tiền đóng (VNĐ) |
| `NgayNop` | DateTime | | Có | Ngày giờ giao dịch nộp tiền |
| `HinhThucNop` | Int | | Có | 0: Trích lương tự động, 1: Chuyển khoản, 2: Tiền mặt |
| `NguoiXacNhanId`| Guid | | Có | Khóa ngoại liên kết bảng DoanVien (Tổ trưởng/Kế toán duyệt) |
| `TrangThai` | Int | | Có | 0: Chờ xác nhận, 1: Đã hoàn thành, 2: Thất bại |

## 4. Thực thể: Đề xuất Phúc lợi (DeXuatPhucLoi / WelfareRequest)
Quản lý các đề xuất xin hỗ trợ khó khăn, thăm hỏi ốm đau, hiếu hỉ.

| Tên Thuộc Tính | Kiểu Dữ Liệu | Độ Rộng | Bắt Buộc | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `Id` | Guid | | Có | Khóa chính |
| `DoanVienId` | Guid | | Có | Khóa ngoại người thụ hưởng |
| `LoaiPhucLoiId`| Guid | | Có | Liên kết bảng Danh mục Loại Phúc Lợi |
| `SoTienDeXuat`| Decimal | (18,2) | Có | Số tiền đề xuất chi |
| `LyDo` | Nvarchar | 500 | Có | Lý do đề xuất (ốm đau, hiếu hỉ, thai sản...) |
| `MinhChungUrl` | Varchar | 500 | Không | Đường dẫn file đính kèm (giấy ra viện, hóa đơn...) |
| `NgayTao` | DateTime | | Có | Ngày tạo yêu cầu |
| `TrangThai` | Int | | Có | 0: Chờ CĐBP duyệt, 1: Chờ CĐCS duyệt, 2: Đã phê duyệt, 3: Từ chối |
| `NgayDuyet` | DateTime | | Không | Ngày phê duyệt cuối cùng |
| `GhiChu` | Nvarchar | 250 | Không | Ghi chú lý do từ chối hoặc hướng dẫn chi trả |
