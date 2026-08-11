# REPORTING AND DASHBOARD

Tài liệu định nghĩa các yêu cầu về Báo cáo và Dashboard của hệ thống Quản lý Điểm danh.

## 1. Dashboard
Trang Dashboard cung cấp cái nhìn tổng quan theo thời gian thực (Real-time).
- **Event hôm nay:** Liệt kê các sự kiện đang diễn ra hôm nay.
- **Event đang diễn ra:** Sự kiện có thời gian bắt đầu <= hiện tại và kết thúc >= hiện tại.
- **Event sắp diễn ra:** Các sự kiện sẽ diễn ra trong tương lai gần (3 ngày tới).
- **Thống kê tham dự (KPIs):**
  - Tổng số người tham dự (Unique).
  - Trạng thái: Số lượng PRESENT (có mặt), ABSENT (vắng mặt), INCOMPLETE (chưa đủ thời gian/số lần điểm danh).
- **Thống kê Kỹ thuật:**
  - Tổng số AttendanceLog nhận được trong ngày.
  - Số lượng Location đang được sử dụng.
  - Trạng thái của các Device (Camera/Đầu đọc thẻ đang Online hay Offline).

## 2. Báo cáo (Reports)
Hệ thống cho phép xuất các báo cáo dạng bảng, hỗ trợ Export ra Excel/CSV/PDF:
1. **Báo cáo theo Event:** Danh sách tất cả người tham gia của một sự kiện, kèm kết quả điểm danh cuối cùng (AttendanceStatus) và chi tiết (First Time, Last Time).
2. **Báo cáo theo User/Person:** Lịch sử tham gia sự kiện của một cá nhân cụ thể (Họ đã tham gia những sự kiện nào, kết quả ra sao).
3. **Báo cáo theo Đơn vị (Organization Unit):** Tỷ lệ tham gia sự kiện của các nhân viên thuộc một khoa/phòng cụ thể.
4. **Báo cáo theo Location / Device:** Thống kê lưu lượng điểm danh qua từng cửa / từng thiết bị để đánh giá tải trọng.
5. **Báo cáo theo Thời gian:** Thống kê tổng lượng sự kiện và người tham gia theo tháng/quý/năm.
6. **Báo cáo theo Trạng thái (AttendanceStatus):** Lọc danh sách những người có trạng thái INCOMPLETE hoặc LATE để rà soát thủ công.
