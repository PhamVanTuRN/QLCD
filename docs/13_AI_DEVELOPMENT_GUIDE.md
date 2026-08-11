# AI DEVELOPMENT GUIDE

Tài liệu này đặc biệt quan trọng. Đây là bộ quy tắc bắt buộc (MANDATORY INSTRUCTIONS) dành cho AI (như bạn) khi tiếp tục phát triển mã nguồn của Phần mềm Quản lý Điểm danh.

## 1. AI PHẢI (MUST DO)
- **Đọc docs trước khi code:** Trước khi bắt tay vào sửa đổi tính năng nào, phải đọc lại tài liệu Functional Requirements, Business Rules và Use Cases tương ứng để đảm bảo đi đúng luồng nghiệp vụ.
- **Giữ kiến trúc hiện tại:** Kiến trúc Clean Architecture với CQRS (MediatR) và Entity Framework Core là bắt buộc. Phải đặt các command/query ở đúng layer (Application).
- **Tuân thủ naming convention:** Sử dụng tên biến, tên class, và các DTO theo phong cách đã có sẵn trong source code.
- **Không duplicate logic:** Nếu một validator hoặc service đã tồn tại, hãy dùng lại thay vì viết mới một logic tương tự.
- **Bảo toàn AttendanceLog:** KHÔNG ĐƯỢC sinh ra logic để `DELETE` hoặc sửa đổi các trường gốc của `RawAttendanceLog`. Dữ liệu này phải là immutable.
- **Tách AttendanceLog và AttendanceResult:** Log là dữ liệu thô. Result là dữ liệu đã qua tính toán. Tuyệt đối không ghép chung hai khái niệm này.
- **Hỗ trợ Event-Location N:N:** Một sự kiện có thể ở nhiều địa điểm. Bắt buộc duy trì quan hệ thông qua bảng trung gian `EventLocation`. KHÔNG ĐƯỢC đổi lại thành 1:N (nghĩa là không được nhét trường `LocationId` trực tiếp vào bảng `Event`).
- **Build sau mỗi thay đổi lớn:** Sau khi sửa xong một Module hoặc Phase, hãy chạy `dotnet build` ngay lập tức để phát hiện lỗi thay vì viết quá nhiều code.

## 2. AI KHÔNG ĐƯỢC (MUST NOT DO)
- **Tự đổi kiến trúc:** Không thêm framework mới, pattern mới (như GraphQL, Dapper, v.v.) trừ khi được yêu cầu rõ ràng.
- **Tự tạo framework mới:** Dùng lại các Base Entity, PagedResult, Exceptions đã có.
- **Drop database:** Trừ khi user yêu cầu xóa hẳn để reset, tuyệt đối không tạo migration mang tính phá hủy dữ liệu (DROP COLUMN, DROP TABLE).
- **Xóa raw attendance data:** Khẳng định lại, không bao giờ được viết chức năng Xóa Raw Logs.
- **Hard-code Event = 1 Location:** Không được mặc định 1 Event chỉ có 1 Location. Luôn lấy danh sách Location của Event thông qua `EventLocations`.
- **Hard-code attendance = CheckIn + CheckOut:** Đừng mặc định điểm danh chỉ là vào và ra. Nó có thể là Window sáng, Window chiều, hoặc Rule tính thời lượng. Phải đọc linh hoạt từ `AttendanceRule` và `AttendanceWindow`.
