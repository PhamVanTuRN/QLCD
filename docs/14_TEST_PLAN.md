# TEST PLAN

Tài liệu này vạch ra kế hoạch kiểm thử cho hệ thống.

## 1. Unit Testing
- Test các Queries và Commands bằng cách mock `IAttendanceDbContext`.
- Kiểm thử kỹ `AttendanceCalculationService` vì đây là core logic.

## 2. Các kịch bản Integration Test chính

**TEST-001: Event chọn nhiều Location**
- Mở form tạo Event, chọn 3 Locations khác nhau.
- Verify bảng `EventLocations` có 3 bản ghi chính xác.

**TEST-002: Location có nhiều Device**
- Tạo 2 thiết bị gán cho cùng 1 Location.
- Quét thẻ thử từ cả 2 thiết bị và verify Log đẩy về có cùng `LocationId`.

**TEST-003: Single attendance rule**
- Cấu hình Rule: Tối thiểu 1 lần quét.
- Tạo 1 Log hợp lệ.
- Chạy Calculate, verify `AttendanceStatus` = `PRESENT`.

**TEST-004: Multiple attendance window**
- Cấu hình Window Sáng (07:00 - 11:00) và Window Chiều (13:00 - 17:00), cả hai đều Required.
- Tạo Log lúc 08:00 (Sáng).
- Calculate -> `INCOMPLETE`.
- Tạo thêm Log lúc 14:00 (Chiều).
- Calculate -> `PRESENT`.

**TEST-005: Attendance log hợp lệ**
- Thiết bị gọi API `ReceiveAttendanceLogCommand` với payload đúng định dạng.
- Trả về mã HTTP 201 (Created), kiểm tra db có bản ghi.

**TEST-006: Duplicate log**
- Đẩy 2 Log từ cùng 1 CCCD, tại cùng 1 thiết bị, cách nhau 2 giây.
- Hệ thống vẫn nhận 2 Log, nhưng không được phép đếm dư khi check logic (hoặc log thứ 2 bị đánh IsValid = false tùy cấu hình).

**TEST-007: Log ngoài attendance window**
- Cấu hình Window Sáng (07:00 - 11:00).
- Tạo Log lúc 12:00.
- Calculate -> `INCOMPLETE` (Vì không nằm trong cửa sổ bắt buộc).

**TEST-008: Ambiguous Event**
- Tạo 2 Event cùng diễn ra tại Hội trường A lúc 09:00 - 10:00.
- Bắn Log từ Device ở Hội trường A lúc 09:15.
- Xác nhận Log không bị ép gán cứng vào 1 Event ngẫu nhiên mà được đánh dấu là không xác định (EventId = null) và ValidationMessage thể hiện Ambiguous.

**TEST-009: Recalculate result**
- Thay đổi Rule thành yêu cầu 2 lần quét thay vì 1.
- Bấm nút Recalculate toàn bộ sự kiện.
- Những người chỉ có 1 lần quét phải đổi trạng thái từ PRESENT sang INCOMPLETE.

**TEST-010: Manual override**
- Chỉnh sửa trạng thái của 1 người đang ABSENT thành PRESENT.
- Verify `IsManualOverride` = true và Audit Log được lưu.
- Bấm Recalculate toàn hệ thống.
- Trạng thái người này vẫn phải giữ là PRESENT (không bị tính toán lại).

**TEST-011: Permission**
- Đăng nhập bằng Role Viewer.
- Gọi API tạo Event. Verify trả về 403 Forbidden.

**TEST-012: Report**
- Sinh dữ liệu mẫu cho 100 người tham gia sự kiện.
- Verify thời gian xuất báo cáo Excel dưới 5 giây.
