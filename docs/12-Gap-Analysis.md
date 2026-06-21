# 12. GAP ANALYSIS - BÁO CÁO ĐÁNH GIÁ KHOẢNG CÁCH CHI TIẾT

Báo cáo này đối chiếu chi tiết giữa hiện trạng mã nguồn hiện tại trong workspace (chỉ là các template trống tạo bởi CLI) với bộ yêu cầu nghiệp vụ đầy đủ của hệ thống QLCD BV108.

## 1. Hiện trạng Mã nguồn trong Workspace
Sau khi quét toàn bộ thư mục `/Users/phuong/Projects/developers/AICode/CDS_CD/QLCD`, mã nguồn hiện trạng như sau:
* **Backend (`QLCD.sln`)**:
  * Gồm 5 dự án: `QLCD.Api`, `QLCD.Application`, `QLCD.Domain`, `QLCD.Infrastructure`, `QLCD.Shared`.
  * Các dự án chỉ chứa file cấu hình `.csproj` và file template mặc định `Class1.cs` hoặc `WeatherForecastController.cs`.
  * Chưa có bất kỳ cấu trúc thư mục Entity, Repository, DbContext hay Business Logic nào.
* **Frontend (`qlcd-web`)**:
  * Là ứng dụng Next.js mới khởi tạo, chỉ chứa trang chủ mặc định của Next.js.
  * Chưa có page routes, services kết nối API, các hook form hoặc UI component cho QLCD.

---

## 2. Các khoảng cách chi tiết và Nhiệm vụ cần thực hiện (Gaps)

### Phân hệ Tổ chức & Cây công đoàn:
* **Hiện trạng**: Chưa có gì.
* **Yêu cầu**: Enum loại tổ chức (CĐCS, CĐBP, Tổ trực thuộc CĐCS, Tổ thuộc CĐBP), Cấp bậc Level (1, 2, 3), Khối chuyên môn, logic chặn CĐCS thứ 2, chặn cấp 4, và chặn thêm con dưới Tổ công đoàn.
* **Công việc cần làm**: 
  * Định nghĩa Entity `DonViCongDoan`, `KhoiChuyenMon` trong `QLCD.Domain`.
  * Tạo validation kiểm tra cấu trúc cây trong `QLCD.Application` (FluentValidation).
  * Viết component cây thư mục có phân loại node và disable chức năng thêm con ở Tổ công đoàn trong `qlcd-web`.

### Phân hệ Đoàn viên & Biến động:
* **Hiện trạng**: Chưa có gì.
* **Yêu cầu**: Hồ sơ cá nhân chi tiết, trình độ đa ngoại ngữ (mối quan hệ 1-N), 9 loại biến động, tính đoàn số tự động (không nhập tay), thực hiện chuyển đơn vị trong Transaction.
* **Công việc cần làm**:
  * Tạo Entity `DoanVien`, `DoanVienNgoaiNgu`, `LichSuBienDong`.
  * Viết CQRS Command `TransferUnionMemberCommand` sử dụng `IDbContextTransaction`.
  * Tạo REST API endpoints và hook frontend tương ứng.

### Cơ chế bảo mật & Kỹ thuật nền:
* **Hiện trạng**: Chưa có.
* **Yêu cầu**: Soft Delete (IsDeleted), Audit Log tự động ghi đè, Phân quyền theo vai trò (Role) và phạm vi dữ liệu (Scope).
* **Công việc cần làm**:
  * Thêm thuộc tính `IsDeleted` và Global Query Filter trong EF Core.
  * Triển khai `AuditLogInterceptor` trong `QLCD.Infrastructure` để tự động log thay đổi dữ liệu vào bảng `AuditLog`.
  * Viết `HasPermissionAttribute` và Middleware kiểm tra ID đơn vị được phép quản lý của user trên Web API.
