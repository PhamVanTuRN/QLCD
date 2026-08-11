# BUSINESS ARCHITECTURE

Tài liệu này mô tả kiến trúc nghiệp vụ tổng thể của Phần mềm Quản lý Điểm danh.

## 1. Luồng nghiệp vụ cốt lõi

Luồng dữ liệu điểm danh chạy qua các thực thể nghiệp vụ sau:

`USER`
  ↓
`EVENT` (Sự kiện cần điểm danh)
  ↓
`EVENT-LOCATION` (Sự kiện diễn ra tại các địa điểm nào)
  ↓
`LOCATION` (Địa điểm/Hội trường)
  ↓
`DEVICE` (Thiết bị lắp đặt tại địa điểm để ghi nhận)
  ↓
`ATTENDANCE LOG` (Dữ liệu ghi nhận thô từ thiết bị trả về)
  ↓
`ATTENDANCE RULE` (Quy tắc và Window áp dụng cho sự kiện)
  ↓
`ATTENDANCE RESULT` (Kết quả tính toán sau khi khớp Log vào Rule)
  ↓
`PARTICIPANT LIST` (Danh sách những người tham gia sự kiện)
  ↓
`REPORT` (Báo cáo thống kê)
  ↓
`HLĐT / CME` (Đẩy dữ liệu qua hệ thống bên ngoài)

## 2. Quan hệ giữa các thực thể chính

### Event - Location (N:N)
- Một Sự kiện (Event) có thể được tổ chức tại nhiều Địa điểm (Location) cùng lúc (ví dụ: phát trực tiếp sang hội trường khác, hoặc chia phòng thảo luận).
- Một Địa điểm (Location) có thể được dùng cho nhiều Sự kiện (ở các khung giờ hoặc ngày khác nhau).

### Location - Device (1:N)
- Một Địa điểm có thể lắp đặt nhiều Thiết bị điểm danh (Device) (như 1 camera ở cửa trước, 1 máy quẹt thẻ ở cửa sau).

### User - Attendance Log (1:N)
- Một Người dùng (User / Participant) có thể phát sinh nhiều Lịch sử điểm danh (AttendanceLog) trong một ngày (ví dụ: đi qua camera nhiều lần). Toàn bộ log này là bất biến (immutable).

### Event - Attendance Window (1:N)
- Một Sự kiện có thể cấu hình nhiều Khung giờ điểm danh (Attendance Window). Ví dụ: Window 1 (Check-in sáng), Window 2 (Check-in chiều).

### Event + User ➔ Attendance Result
- Từ tập hợp các `AttendanceLog` của một `User` khớp vào các `AttendanceRule` và `AttendanceWindow` của một `Event`, hệ thống sẽ tính toán và sinh ra duy nhất một bản ghi `AttendanceResult` chứa trạng thái cuối cùng (PRESENT, ABSENT, INCOMPLETE, LATE, v.v.).
