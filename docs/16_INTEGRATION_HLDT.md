# HLĐT INTEGRATION

Tài liệu này mô tả luồng tích hợp với Phần mềm Quản lý Huấn luyện Đào tạo (HLĐT).

## 1. Mục tiêu
Hệ thống Điểm danh (AttendanceManagement) đóng vai trò là Module xử lý Logic Điểm Danh độc lập. HLĐT là hệ thống chính lưu trữ danh sách Học viên, Lớp học, Bài giảng và Cấp chứng chỉ.

## 2. Business Key
Khóa chính duy nhất để hai hệ thống nói chuyện với nhau là: **CCCD (Căn cước công dân)**.
Không được phép dùng Database ID của hệ thống này để trỏ sang hệ thống kia.

## 3. Luồng dữ liệu (Data Flow)

### 3.1. HLĐT cấp phát Sự kiện (Optional)
HLĐT gọi API sang hệ thống Điểm danh để tạo Event.
Payload bao gồm:
- Tên sự kiện (Tên lớp học)
- Thời gian bắt đầu/kết thúc
- Yêu cầu điểm danh (Ví dụ: Bắt buộc điểm danh sáng, chiều).
- Danh sách CCCD người tham gia (Tùy chọn).

### 3.2. AttendanceManagement trả kết quả
Sau khi sự kiện kết thúc, HLĐT có thể:
1. Gọi API `GET /api/integrations/hldt/results/{eventCode}` để lấy danh sách.
2. Hoặc AttendanceManagement dùng Webhook/Cronjob đẩy kết quả sang HLĐT.

Dữ liệu trả về gồm:
- Khóa chính: `CCCD`
- Tên sự kiện: `EventCode`
- Trạng thái: `AttendanceStatus` (PRESENT, ABSENT, INCOMPLETE...)
- Thời điểm đến sớm nhất: `FirstAttendanceTime`
- Thời điểm rời đi muộn nhất: `LastAttendanceTime`
- Khung giờ đã hoàn thành: `CompletedRequiredWindows`
- Chi tiết: `ResultReason` (Nếu vắng/không đạt thì lý do là gì).
