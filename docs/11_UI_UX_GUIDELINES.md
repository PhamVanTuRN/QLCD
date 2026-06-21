# 11. UI/UX GUIDELINES - NGUYÊN TẮC UI/UX

Tài liệu này định hình phong cách thiết kế giao diện (UI) và trải nghiệm người dùng (UX) cho phần mềm QLCD BV108.

## 1. Phong cách Thiết kế & Tone màu Chủ đạo
Vì hệ thống phục vụ trong môi trường quân đội (Bệnh viện TWQĐ 108) kết hợp với y tế, bảng màu được thiết kế hài hòa giữa sắc xanh lá đặc trưng của quân phục nhẹ và sắc xanh y tế tin cậy, sạch sẽ.

* **Bảng màu (Color Palette)**:
  * **Màu chủ đạo (Primary)**: `#1E4620` (Xanh lá quân đội đậm - thể hiện sự trang nghiêm, kỷ luật) hoặc `#0284C7` (Xanh nước biển y tế - thể hiện sự chuyên nghiệp y khoa).
  * **Màu phụ trợ (Secondary)**: `#059669` (Xanh ngọc - màu của sức sống, phúc lợi công đoàn).
  * **Màu nền (Background)**:
    * Light Mode: `#F8FAFC` (Màu xám trắng tinh tế, giảm mỏi mắt cho nhân viên trực y tế).
    * Dark Mode: `#0F172A` (Màu tối xanh đen sang trọng).
  * **Màu cảnh báo (Alerts)**:
    * Lỗi/Nguy hiểm: `#EF4444` (Đỏ).
    * Cảnh báo/Chờ duyệt: `#F59E0B` (Vàng hổ phách).
    * Thành công: `#10B981` (Xanh lá cây).

## 2. Phông chữ (Typography)
* Sử dụng các phông chữ hiện đại, hỗ trợ hiển thị tiếng Việt hoàn hảo, dễ đọc trên cả màn hình máy tính và thiết bị di động:
  * Phông chủ đạo: **Inter** hoặc **Outfit** (từ Google Fonts).
  * Kích thước văn bản cơ bản (Body text): `14px` (`text-sm`) hoặc `16px` (`text-base`).
  * Tiêu đề chính (Headings): `24px` đến `32px` với định dạng chữ đậm (`font-bold`).

## 3. Quy tắc Thiết kế Responsive & Tương thích Di động
* **Hỗ trợ 100% Responsive**: Giao diện tự động co giãn tối ưu trên các độ phân giải từ màn hình Desktop lớn (1920x1080) đến Laptop (1366x768), Tablet và Smartphone (iOS/Android).
* **Ứng dụng Mobile-First cho Tổ trưởng và Đoàn viên**: Các tính năng của đoàn viên (đăng ký trợ cấp, xem tin tức) và của Tổ trưởng (xác nhận đóng đoàn phí nhanh bằng một lần chạm) cần được tối ưu nút bấm to, rõ ràng, giảm thiểu việc phải gõ văn bản nhiều.

## 4. Các yếu tố tăng trải nghiệm người dùng (Micro-animations)
* **Hover Effects**: Các nút bấm, thẻ thông tin (cards) hoặc dòng bảng khi di chuột qua phải có hiệu ứng chuyển màu mượt mà (`transition-all duration-300`) kết hợp đổ bóng mờ nhẹ (`shadow-md`).
* **Trạng thái Loading**: Khi hệ thống đang tải dữ liệu hoặc gửi request phê duyệt, phải có hiệu ứng Skeleton Loading (khung xám mờ chuyển động nhẹ) thay cho màn hình trống trơn, tạo cảm giác hệ thống phản hồi nhanh.
* **Thông báo tức thời (Toast)**: Sau khi thực hiện hành động thành công hoặc thất bại, hiển thị hộp thoại nhỏ góc trên bên phải màn hình tự động biến mất sau 3 giây để người dùng nắm bắt kết quả mà không cần bấm tắt.
