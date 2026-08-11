# ROADMAP

Lộ trình phát triển phần mềm Quản lý điểm danh.

## PHASE 1: Core Attendance Management
- Hoàn thiện luồng điểm danh cốt lõi.
- Quản lý Event, Location, Device.
- Cấu hình Rule & Window.
- Tính toán kết quả.
- Manual Override.

## PHASE 2: Device Integration
- Tích hợp chuẩn hóa với các thiết bị phần cứng thực tế (Camera AI, API nhận diện, máy quét RFID).
- Xử lý debounce logs, nhận dạng sai.

## PHASE 3: Advanced Reports
- Xây dựng module Báo cáo nâng cao (Dashboard biểu đồ trực quan, Export PDF tự động).

## PHASE 4: HLĐT Integration
- Tích hợp với hệ thống Huấn luyện Đào tạo qua chuẩn RestAPI (Sử dụng CCCD làm khóa chính).
- Tự động kéo danh sách học viên từ HLĐT xuống Event.

## PHASE 5: CME (Continuing Medical Education)
- Quản lý việc cấp chứng chỉ đào tạo liên tục dựa trên kết quả điểm danh. (Nếu được phép triển khai trên hệ thống này thay vì HLĐT).

## PHASE 6: Advanced Automation/AI (nếu cần)
- Cảnh báo điểm danh hộ, điểm danh bất thường.
- Dò tìm gian lận (ví dụ: quét cửa trước và cửa sau cách nhau 1 giây - impossible travel).
