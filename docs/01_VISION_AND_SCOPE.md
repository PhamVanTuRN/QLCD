# VISION AND SCOPE

Tài liệu này xác định phạm vi dự án của Hệ thống Quản lý Điểm danh (AttendanceManagement).

## 1. IN SCOPE (Trong phạm vi dự án)
Hệ thống sẽ xây dựng và bao gồm các chức năng/đối tượng sau:

1. **User & Organization Unit:** Quản lý người dùng và phân quyền theo phòng ban.
2. **Event (Sự kiện):** Tạo và quản lý thông tin sự kiện cần điểm danh.
3. **Location (Địa điểm / Hội trường):** Quản lý danh sách các địa điểm tổ chức.
4. **Event-Location:** Gán nhiều địa điểm cho một sự kiện (N:N relationship).
5. **Attendance Device (Thiết bị):** Quản lý camera, đầu đọc thẻ, hoặc các thiết bị ghi nhận điểm danh đặt tại các địa điểm.
6. **Attendance Rule:** Cấu hình quy tắc bắt buộc điểm danh của sự kiện (VD: phải có mặt 2 lần, hoặc tối thiểu 45 phút).
7. **Attendance Window:** Cấu hình các khung giờ điểm danh cho sự kiện (VD: Khung giờ vào 07:00-08:00, Khung giờ ra 11:30-12:30).
8. **Attendance Log (Lịch sử điểm danh):** Tiếp nhận và lưu trữ nguyên vẹn dữ liệu điểm danh từ thiết bị đẩy về (Raw logs).
9. **Attendance Result (Kết quả điểm danh):** Tự động tính toán kết quả tham dự của người dùng dựa trên Raw Logs và Attendance Rules.
10. **Manual Attendance:** Quản trị viên ghi nhận điểm danh thủ công hoặc ghi đè kết quả (Manual Override).
11. **Reports (Báo cáo):** Kết xuất báo cáo danh sách tham dự, thống kê tỷ lệ hiện diện, vắng mặt.
12. **Dashboard:** Thống kê tổng quan trạng thái sự kiện hôm nay, số người điểm danh, số lượng thiết bị hoạt động.
13. **Permissions:** Hệ thống phân quyền RBAC dựa trên các Role.
14. **Integration HLĐT:** Tích hợp với hệ thống Huấn luyện Đào tạo để gửi/nhận thông tin điểm danh thông qua khóa chính là CCCD.

## 2. OUT OF SCOPE (Ngoài phạm vi giai đoạn đầu)
Các tính năng sau sẽ không được thực hiện trong phiên bản này:

1. **Tính CME hoàn chỉnh:** Hệ thống chỉ cung cấp dữ liệu tham gia, việc đánh giá và quy đổi ra số giờ CME sẽ do hệ thống HLĐT (hoặc chức năng ở giai đoạn sau) đảm nhận.
2. **Quản lý chương trình đào tạo toàn diện:** Không quản lý bài giảng, tài liệu, lớp học.
3. **AI nhận diện khuôn mặt:** Nhận diện khuôn mặt sẽ do các thiết bị Camera AI bên ngoài đảm nhiệm. Phần mềm chỉ cung cấp API để nhận Log từ thiết bị trả về.
4. **Quản lý tài chính:** Không quản lý học phí, chi phí sự kiện.
5. **Các nghiệp vụ không liên quan đến điểm danh:** Quản lý khám chữa bệnh, bệnh án, v.v.
