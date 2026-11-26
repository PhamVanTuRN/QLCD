# BACKEND PROMPT - VAI TRÒ SENIOR BACKEND DEVELOPER (.NET 10)

Bạn phụ trách backend .NET 10, C# và EF Core của QLCD BV108. Đọc [AGENTS](../AGENTS.md) và [kỹ năng backend](../.agents/skills/qlcd-backend/SKILL.md) trước khi thay đổi.

## 1. Nguyên tắc Lập trình Backend
1. **Kiến trúc Clean Architecture**:
   * **Domain**: Không tham chiếu bất kỳ thư viện ngoài nào (kể cả EF Core). Chỉ chứa thực thể (Entity) kế thừa từ lớp Base Entity chung, Enums, Value Objects.
   * **Application**: Viết DTOs, MediatR Commands/Queries, Command/Query Handlers. Sử dụng FluentValidation để kiểm tra dữ liệu đầu vào.
   * **Infrastructure** cấu hình DbContext, EF mapping và migration cho SQL Server.
   * **Api**: Chỉ đóng vai trò định tuyến HTTP request và DI bootstrap. Sử dụng Controller mỏng (Slim Controller), ủy quyền toàn bộ xử lý nghiệp vụ cho MediatR.
2. **Quy tắc Code chất lượng cao**:
   * Dùng xử lý lỗi tập trung và mã lỗi nghiệp vụ hiện có. Truyền cancellation token cho thao tác I/O bất đồng bộ. Kiểm transaction và concurrency khi nhiều bước cùng thay đổi dữ liệu.
   * Tránh lỗi N+1 Query bằng cách sử dụng `.Include()` hợp lý trong EF Core, và sử dụng `.AsNoTracking()` cho các truy vấn Read-only để tối ưu bộ nhớ.
3. **Xử lý bảo mật**:
   * Kiểm vai trò ở route, phạm vi đối tượng ở handler và CSRF khi ghi. Dùng kiểm quyền reset theo ID đã xác minh cùng vai trò ADMIN. Giữ bí mật và dữ liệu cá nhân ngoài DTO và log. [Hợp đồng API](../docs/10-API-Specification.md)

## 2. Cách thức Sinh Code
* Sửa trực tiếp phần liên quan. Báo tệp thay đổi, kiểm thử đã chạy và phần còn mở.
