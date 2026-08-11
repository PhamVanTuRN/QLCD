# FUNCTIONAL REQUIREMENTS

Tài liệu này liệt kê các Yêu cầu Chức năng (Functional Requirements - FR) của hệ thống Quản lý Điểm danh.

## 1. Quản lý Sự kiện (Event) & Địa điểm (Location)
- **FR-EVT-001:** Hệ thống cho phép tạo, sửa, xóa (soft delete), và xem danh sách Sự kiện.
- **FR-EVT-002:** Hệ thống cho phép gán một hoặc nhiều Địa điểm (Location) cho một Sự kiện thông qua quan hệ N:N.
- **FR-LOC-001:** Quản lý danh mục Địa điểm (Location).

## 2. Quản lý Thiết bị (Device)
- **FR-DEV-001:** Quản lý Thiết bị điểm danh, gán Thiết bị vào Địa điểm.
- **FR-DEV-002:** Cho phép thiết bị gọi API nhận xác thực để cấu hình kết nối.

## 3. Cấu hình Quy tắc Điểm danh (Attendance Configuration)
- **FR-RUL-001:** Cho phép cấu hình Attendance Rule cho từng Sự kiện (Số lần quét tối thiểu, thời gian hiện diện tối thiểu).
- **FR-RUL-002:** Cho phép định nghĩa nhiều Attendance Window (Khung giờ) cho từng Sự kiện. Có thể đánh dấu cờ `Required`.

## 4. Quá trình Điểm danh (Attendance Logging)
- **FR-ATT-001:** Hệ thống cung cấp API tiếp nhận Raw Logs từ Thiết bị (`ReceiveAttendanceLogCommand`).
- **FR-ATT-002:** Hệ thống chống duplicate log: Nếu cùng một người quét cùng một máy trong khoảng thời gian rất ngắn (ví dụ: 10 giây), log vẫn được nhận nhưng có thể đánh dấu IsValid = false (debounce) hoặc được lọc ở khâu tính toán.
- **FR-ATT-003:** Khi nhận Log, hệ thống phải tự động truy xuất `Location` của thiết bị để suy luận ra `Event` đang diễn ra.

## 5. Tính toán Kết quả (Attendance Result)
- **FR-CAL-001:** Hệ thống tự động tính toán `AttendanceResult` cho mỗi người tham dự dựa vào `Raw Logs`, `Rules` và `Windows` của Sự kiện.
- **FR-CAL-002:** `AttendanceResult` hiển thị chi tiết (First Time, Last Time, số log hợp lệ, trạng thái).
- **FR-CAL-003:** Cho phép quản trị viên kích hoạt tính năng **Recalculate** toàn bộ kết quả của một Sự kiện khi quy tắc thay đổi.
- **FR-CAL-004:** Cho phép quản trị viên **Manual Override** kết quả của một cá nhân, bắt buộc lưu vết kiểm toán (Audit Log) kèm lý do ghi đè.

## 6. Báo cáo & Thống kê (Reporting)
- **FR-REP-001:** Cung cấp danh sách tham dự chi tiết theo Sự kiện, hiển thị trạng thái (PRESENT, ABSENT, INCOMPLETE, v.v.).
- **FR-REP-002:** Xuất dữ liệu điểm danh ra file (Excel/CSV).
- **FR-REP-003:** Dashboard tổng quan số liệu sự kiện trong ngày.
