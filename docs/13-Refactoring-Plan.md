# 13. REFACTORING PLAN - KẾ HOẠCH TÁI CẤU TRÚC AN TOÀN

Tài liệu này xác định phương án tái cấu trúc mã nguồn khung hiện tại lên kiến trúc chuẩn Clean Architecture đáp ứng đầy đủ các yêu cầu kỹ thuật nâng cao.

## 1. Tách cấu trúc các dự án con (Projects)
* **QLCD.Domain**:
  * Tạo thư mục `Entities/` và thêm: `DonViCongDoan.cs`, `DoanVien.cs`, `DoanVienNgoaiNgu.cs`, `KhoiChuyenMon.cs`, `LichSuBienDong.cs`, `AuditLog.cs`, `HoatDongCongDoan.cs`, `PhucLoiThoai.cs`.
  * Tạo thư mục `Enums/` để lưu: `LoaiToChuc.cs`, `VaiTroCongDoan.cs`, `TrangThaiDoanVien.cs`, `LoaiBienDong.cs`.
  * Tạo thư mục `Common/` chứa lớp `BaseEntity.cs` (có `Id`, `CreatedDate`, `CreatedBy`, `UpdatedDate`, `UpdatedBy`, `IsDeleted`).
* **QLCD.Infrastructure**:
  * Cấu hình DbContext (`QLCDContext.cs`) kết nối SQL Server/Postgres.
  * Viết EF Configurations (`Configurations/`) kế thừa từ một interface cấu hình chung có cấu hình Global Query Filter tự động loại trừ bản ghi `IsDeleted == true`.
  * Tạo `Interceptors/` chứa `AuditLogInterceptor.cs` tự động phân tích Entity State để ghi đè vào bảng `AuditLog` trước khi hoàn tất lưu thay đổi.
* **QLCD.Application**:
  * Tạo `Behaviors/` chứa `ValidationBehavior.cs` tự động validate các Fluent Validation trước khi MediatR Handler xử lý Command.
  * Thêm `DTOs/` và `AutoMapperProfiles/` tương ứng.

## 2. Kế hoạch triển khai an toàn
* Thực hiện viết code thực thể (Domain) trước để làm bộ khung tham chiếu.
* Viết DbContext và Migration để đảm bảo cơ sở dữ liệu đồng bộ.
* Triển khai MediatR Commands/Queries theo từng phân hệ chức năng: Tổ chức -> Đoàn viên -> Biến động -> các phân hệ còn lại.
