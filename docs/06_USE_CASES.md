# USE CASES

Tài liệu này mô tả các Use Case chính của hệ thống.

**UC-001 Quản lý Event**
- Actor: Admin, Organizer
- Main Flow: Người dùng tạo sự kiện, điền mã sự kiện, tên, thời gian bắt đầu và kết thúc.
- Postconditions: Sự kiện được lưu vào database.

**UC-002 Gán nhiều Location cho Event**
- Actor: Admin, Organizer
- Preconditions: Đã tạo Event và Location.
- Main Flow: Người dùng chọn Event, sau đó chọn nhiều Location (phòng họp, hội trường) từ danh sách để gán.
- Postconditions: Bảng EventLocation được cập nhật.

**UC-003 Quản lý Location**
- Actor: Admin
- Main Flow: Tạo mới, cập nhật, hoặc xóa (soft delete) một Địa điểm.

**UC-004 Quản lý Device**
- Actor: Admin, IT Support
- Main Flow: Đăng ký một thiết bị Camera AI / Đầu đọc thẻ vào hệ thống, gán nó thuộc về một `Location` cụ thể.

**UC-005 Cấu hình Attendance Rule**
- Actor: Organizer
- Main Flow: Mở chi tiết Sự kiện, cấu hình quy tắc: yêu cầu quét thẻ tối thiểu bao nhiêu lần (MinimumRequiredCheckpoints), yêu cầu thời lượng bao nhiêu (MinimumDurationMinutes).

**UC-006 Cấu hình Attendance Window**
- Actor: Organizer
- Main Flow: Tạo các khung giờ cụ thể (Sáng, Chiều) cho Sự kiện, cài đặt cờ `Required`.

**UC-007 Tiếp nhận Attendance Log**
- Actor: System (Device API)
- Main Flow: Thiết bị gửi API (CCCD, Time, DeviceId). Hệ thống lưu trữ vào bảng `RawAttendanceLog`.

**UC-008 Xác định Event từ Device**
- Actor: System
- Main Flow: Khi nhận Log, hệ thống dùng `DeviceId` tìm ra `Location`. Sau đó tìm các `Event` đang diễn ra tại `Location` đó trong thời điểm Log phát sinh để gán `EventId` cho Log.
- Exception Flow: Nếu có từ 2 sự kiện trở lên cùng phù hợp (trùng Location, trùng thời gian), Log bị đánh dấu Ambiguous (EventId = NULL).

**UC-009 Tính kết quả điểm danh**
- Actor: System
- Main Flow: Xử lý Log thông qua Windows và Rules. Quyết định trạng thái PRESENT, INCOMPLETE, hoặc ABSENT và lưu vào `AttendanceResult`.

**UC-010 Xem danh sách tham dự**
- Actor: Organizer, Admin
- Main Flow: Truy cập Dashboard sự kiện, xem danh sách `AttendanceResult`.

**UC-011 Manual Attendance (Manual Override)**
- Actor: Organizer
- Main Flow: Chọn một kết quả điểm danh cụ thể (hoặc một User), chọn ghi đè thành `PRESENT` và nhập lý do.
- Postconditions: `IsManualOverride = true`, kết quả được cập nhật.

**UC-012 Recalculate Attendance**
- Actor: Organizer
- Main Flow: Người dùng bấm nút Tính toán lại. Hệ thống bỏ qua các bản ghi bị ghi đè thủ công, xóa logic tính cũ và quét lại Raw Logs để tính Result.

**UC-013 Báo cáo thống kê**
- Actor: Admin, Viewer
- Main Flow: Sinh báo cáo tổng quan.

**UC-014 Đồng bộ HLĐT**
- Actor: System (Cronjob hoặc Webhook)
- Main Flow: Trả dữ liệu những người có trạng thái `PRESENT` sang hệ thống HLĐT thông qua CCCD để cấp CME.
