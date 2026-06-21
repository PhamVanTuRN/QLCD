# 14. TEST PLAN - KẾ HOẠCH KIỂM THỬ

Tài liệu này định hình chiến lược, phương pháp và các kịch bản kiểm thử chính nhằm đảm bảo chất lượng phần mềm QLCD.

## 1. Chiến lược Kiểm thử (Testing Strategy)
Hệ thống sẽ được kiểm thử qua 3 cấp độ chính:
* **Kiểm thử Đơn vị (Unit Testing)**: Tập trung kiểm tra tính đúng đắn của các Business Rules trong tầng Domain và xử lý logic trong tầng Application của Backend. Đạt độ phủ mã nguồn (Code Coverage) tối thiểu **80%** cho các lớp này.
* **Kiểm thử Tích hợp (Integration Testing)**: Kiểm tra sự tương tác giữa Application và Infrastructure (đặc biệt là kết nối cơ sở dữ liệu thực tế thông qua các InMemory Database hoặc Test Container). Kiểm tra các API endpoints.
* **Kiểm thử Chấp nhận Người dùng (User Acceptance Testing - UAT)**: Tổ chức kiểm thử thực tế với Tổ trưởng và cán bộ Công đoàn BV108 để đánh giá độ tiện dụng, tốc độ phản hồi và độ chính xác của nghiệp vụ.

## 2. Kịch bản Kiểm thử Nghiệp vụ Trọng tâm (Core Test Cases)

### TC_MEM_01: Kiểm tra tính đúng đắn khi chuyển sinh hoạt công đoàn
* **Mục tiêu**: Đảm bảo lịch sử đóng đoàn phí và thi đua không bị mất khi chuyển tổ công đoàn.
* **Các bước thực hiện**:
  1. Chọn đoàn viên A thuộc Tổ công đoàn X (đã đóng đoàn phí các tháng 1, 2, 3).
  2. Thực hiện thao tác chuyển đoàn viên A sang Tổ công đoàn Y.
  3. Kiểm tra thông tin của đoàn viên A tại Tổ Y.
* **Kết quả kỳ vọng**:
  * Mã tổ công đoàn của đoàn viên A cập nhật thành Tổ Y.
  * Truy vấn bảng `DongDoanPhi` vẫn hiển thị đầy đủ lịch sử đóng phí tháng 1, 2, 3 của đoàn viên A.
  * Số dư quỹ của Tổ X giảm đi tương ứng và Tổ Y tăng lên nếu có cơ chế chia sẻ quỹ di động.

### TC_FIN_01: Kiểm tra việc áp dụng quy tắc đóng đoàn phí tối đa
* **Mục tiêu**: Đảm bảo số tiền đóng đoàn phí không vượt quá hạn mức trần của Tổng Liên đoàn Lao động đối với lao động hợp đồng.
* **Đầu vào thử nghiệm**: Tạo một đoàn viên là lao động hợp đồng có lương cơ bản cao (Ví dụ: 30.000.000 VNĐ).
* **Các bước thực hiện**:
  1. Chạy tiến trình tính đoàn phí tự động của tháng.
* **Kết quả kỳ vọng**:
  * Số tiền đóng đoàn phí của người đó phải bằng mức trần tối đa quy định (ví dụ 10% lương tối thiểu vùng, khoảng 468.000 VNĐ) chứ không phải là 1% lương thực tế (300.000 VNĐ) nếu 1% lương thực tế vượt quá mức trần này (quy định tùy theo từng thời điểm pháp luật).

### TC_AWD_01: Kiểm tra ràng buộc tỷ lệ khống chế khen thưởng
* **Mục tiêu**: Đảm bảo không cho phép duyệt quá 15% đoàn viên xuất sắc tại cấp CĐBP.
* **Đầu vào thử nghiệm**: CĐBP Khối Nội 1 có tổng cộng 100 đoàn viên.
* **Các bước thực hiện**:
  1. Đăng nhập tài khoản Chủ tịch CĐBP Khối Nội 1.
  2. Chọn danh sách đề xuất thi đua gồm 16 đoàn viên xếp loại "Đoàn viên xuất sắc".
  3. Bấm nút "Gửi duyệt lên CĐCS".
* **Kết quả kỳ vọng**:
  * Hệ thống chặn hành động gửi duyệt.
  * Hiển thị thông báo lỗi chi tiết: "Số lượng đề xuất vượt quá chỉ tiêu cho phép (Tối đa 15 đoàn viên xuất sắc/100 đoàn viên hiện có)".
