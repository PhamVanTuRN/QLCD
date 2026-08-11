# HƯỚNG DẪN TEST NGHIỆM THU

Tài liệu hướng dẫn các bước kiểm thử để nghiệm thu Phần mềm Quản lý điểm danh.

## I. MỤC ĐÍCH
Xác nhận hệ thống Điểm danh (AttendanceManagement) đáp ứng các chức năng nghiệp vụ như đã cam kết trong Vision and Scope và Functional Requirements.

## II. MÔI TRƯỜNG TEST
- Môi trường: Staging / UAT.
- Thiết bị: Ít nhất 1 tài khoản Admin, 1 tài khoản Organizer. Có Postman để giả lập gọi API nhận Log từ thiết bị camera/RFID.

## III. KỊCH BẢN NGHIỆM THU (UAT SCENARIOS)

### 1. Quản lý sự kiện và địa điểm
**Mục tiêu:** Tạo được sự kiện và gán được nhiều địa điểm.
**Các bước:**
1. Đăng nhập với quyền Admin.
2. Vào Quản lý Địa điểm (Location), tạo 2 địa điểm: "Hội trường A", "Hội trường B".
3. Vào Quản lý Sự kiện (Event), tạo sự kiện "Đại hội ABC".
4. Trong chi tiết sự kiện, gán cả "Hội trường A" và "Hội trường B".
**Kết quả mong đợi:** Sự kiện được lưu thành công, danh sách hiển thị Sự kiện có 2 địa điểm trực thuộc.

### 2. Cấu hình quy tắc điểm danh
**Mục tiêu:** Cấu hình thành công Rule và Window cho sự kiện.
**Các bước:**
1. Chọn sự kiện "Đại hội ABC".
2. Vào tab Cấu hình (Configuration).
3. Thêm Window Sáng: 07:00 - 11:30 (Required = True).
4. Thêm Window Chiều: 13:00 - 17:00 (Required = True).
5. Đặt Rule: Yêu cầu tối thiểu 2 lần quét.
**Kết quả mong đợi:** Hệ thống lưu cấu hình và hiển thị đúng thông số.

### 3. Nhận dữ liệu điểm danh từ thiết bị (Giả lập)
**Mục tiêu:** API nhận Log thành công.
**Các bước:**
1. Tạo một Device và gán vào "Hội trường A". Lấy `DeviceId`.
2. Dùng Postman, gọi API `POST /api/attendancelogs/receive`.
3. Gửi Payload chứa `deviceId`, `cccd`, và `attendanceTime` (nằm trong khoảng Sáng).
**Kết quả mong đợi:** Postman trả về HTTP 201 Created. Trên UI Dashboard, tổng số Log tăng lên 1. Màn hình Raw Logs hiển thị bản ghi vừa gửi.

### 4. Tính toán kết quả (Tự động)
**Mục tiêu:** Hệ thống tính đúng trạng thái dựa trên Log.
**Các bước:**
1. Sau bước 3, người có `cccd` vừa gửi mới chỉ có 1 Log Sáng.
2. Hệ thống (hoặc job) chạy tính toán -> Kết quả của người này là `INCOMPLETE`.
3. Tiếp tục giả lập gửi thêm 1 Log vào buổi chiều (14:00) cho cùng người này.
4. Hệ thống tính toán lại -> Kết quả chuyển thành `PRESENT`.
**Kết quả mong đợi:** Logic tính toán đúng theo số lượng Window bắt buộc đã cấu hình ở bước 2.

### 5. Ghi đè thủ công (Manual Override)
**Mục tiêu:** Cho phép sửa kết quả bằng tay.
**Các bước:**
1. Tìm một người đang có trạng thái `ABSENT`.
2. Bấm nút Sửa kết quả (Override).
3. Đổi trạng thái thành `PRESENT`, nhập lý do "Xác nhận có mặt qua điện thoại".
4. Bấm Lưu.
**Kết quả mong đợi:** Trạng thái chuyển sang `PRESENT`. Bảng hiển thị cờ `Manual` và lý do ghi đè.

### 6. Xuất báo cáo (Export)
**Mục tiêu:** Báo cáo xuất ra file hợp lệ.
**Các bước:**
1. Vào trang Báo cáo sự kiện.
2. Chọn "Đại hội ABC". Bấm Xuất Excel.
**Kết quả mong đợi:** File Excel được tải xuống, có đầy đủ các cột (Họ tên, CCCD, Trạng thái điểm danh, Giờ tới, Giờ về).
