# 06. USE CASES - CA SỬ DỤNG

Tài liệu này đặc tả các Use Case cốt lõi của hệ thống QLCD BV108.

## 1. Biểu đồ Use Case Tổng thể (Tổng quan)
Các tác nhân chính của hệ thống bao gồm:
* **Union Member (Đoàn viên)**
* **Sub-Union Leader (Tổ trưởng công đoàn)**
* **Branch Union BCH (Ban chấp hành CĐBP)**
* **Primary Union BCH (Ban chấp hành CĐCS)**
* **Admin (Quản trị viên hệ thống)**

## 2. Đặc tả các Use Case Chính

### Use Case UC-01: Đăng ký đề xuất hỗ trợ khó khăn/thăm hỏi
* **Tác nhân**: Đoàn viên hoặc Tổ trưởng công đoàn.
* **Mục tiêu**: Gửi yêu cầu trợ cấp tài chính hoặc thăm hỏi lên cấp trên.
* **Điều kiện tiên quyết**: Đoàn viên có trạng thái `Đang hoạt động`.
* **Luồng sự kiện chính**:
  1. Tác nhân đăng nhập vào hệ thống, chọn chức năng "Đăng ký hỗ trợ/thăm hỏi".
  2. Hệ thống hiển thị form đăng ký gồm: Loại phúc lợi, Số tiền đề xuất (tự gợi ý theo cấu hình danh mục), Lý do, Minh chứng đi kèm.
  3. Tác nhân điền đầy đủ thông tin, tải file ảnh minh chứng lên và nhấn "Gửi đề xuất".
  4. Hệ thống kiểm tra tính hợp lệ của dữ liệu (bắt buộc nhập lý do, kiểm tra kích thước ảnh), lưu trạng thái là `Chờ CĐBP duyệt`.
  5. Hệ thống gửi thông báo (Notification) đến Chủ tịch CĐBP quản lý đoàn viên đó.
* **Luồng rẽ nhánh**:
  * *Bước 3 - Thiếu thông tin*: Hệ thống báo lỗi và yêu cầu nhập lại các trường còn thiếu trước khi gửi.
* **Điều kiện sau**: Đề xuất được lưu thành công trên database và sẵn sàng để thẩm định.

### Use Case UC-02: Xác nhận đóng Đoàn phí tháng
* **Tác nhân**: Tổ trưởng công đoàn.
* **Mục tiêu**: Ghi nhận việc đóng đoàn phí của đoàn viên thuộc tổ khi thu tiền mặt trực tiếp.
* **Điều kiện tiên quyết**: Đoàn viên thuộc cùng Tổ công đoàn với Tổ trưởng.
* **Luồng sự kiện chính**:
  1. Tổ trưởng đăng nhập, truy cập danh sách "Đoàn phí của tổ".
  2. Hệ thống hiển thị danh sách đoàn viên trong tổ kèm trạng thái đóng phí của tháng hiện tại.
  3. Tổ trưởng chọn những đoàn viên đã đóng tiền mặt, bấm nút "Xác nhận đóng phí".
  4. Hệ thống yêu cầu nhập hình thức nộp (Tiền mặt/Chuyển khoản) và số tiền đóng thực tế.
  5. Tổ trưởng nhấn "Xác nhận".
  6. Hệ thống tạo bản ghi giao dịch đóng đoàn phí với trạng thái `Đã hoàn thành`, ghi nhận số dư quỹ được tích lũy cho Tổ và cập nhật trạng thái đóng phí của đoàn viên.
  7. Hệ thống tự động gửi thông báo xác nhận đóng phí thành công đến từng đoàn viên qua ứng dụng di động/web.

### Use Case UC-03: Bình xét thi đua cuối năm
* **Tác nhân**: Ban chấp hành CĐBP, Ban chấp hành CĐCS.
* **Mục tiêu**: Đánh giá phân loại đoàn viên xuất sắc dựa trên đề xuất của các Tổ công đoàn và áp dụng quy tắc tỷ lệ khống chế.
* **Luồng sự kiện chính**:
  1. BCH CĐBP truy cập danh sách đề xuất thi đua từ các Tổ gửi lên.
  2. Hệ thống hiển thị danh sách đề xuất kèm các thông tin bổ sung (tỷ lệ đóng đoàn phí, số lần tham gia phong trào, lịch sử kỷ luật).
  3. BCH CĐBP thực hiện chọn lọc, đánh dấu duyệt hoặc từ chối các đề xuất khen thưởng của tổ.
  4. Hệ thống kiểm tra điều kiện tỷ lệ khống chế (không vượt quá 15% tổng số đoàn viên của CĐBP). Nếu vượt quá, hệ thống hiển thị cảnh báo đỏ và ngăn chặn việc bấm gửi duyệt lên cấp CĐCS.
  5. BCH CĐBP điều chỉnh danh sách cho khớp chỉ tiêu, sau đó nhấn "Gửi duyệt lên CĐCS".
  6. Ban Chấp hành CĐCS nhận danh sách tổng hợp, xem xét và bấm phê duyệt ban hành quyết định khen thưởng cuối cùng.
