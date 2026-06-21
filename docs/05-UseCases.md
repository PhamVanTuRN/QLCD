# 05. USE CASES - CA SỬ DỤNG HỆ THỐNG

Tài liệu này đặc tả các Use Case (UC) tương ứng với các phân hệ chức năng bổ sung.

## 1. UC_ORG_01: Quản lý Cây Tổ chức Công đoàn
* **Tác nhân**: Admin hệ thống, Chủ tịch CĐCS.
* **Luồng chính**:
  1. Tác nhân mở màn hình Quản lý Tổ chức. Hệ thống hiển thị Cây tổ chức 3 cấp.
  2. Tác nhân click vào một đơn vị trong cây để xem chi tiết hoặc thêm đơn vị con.
  3. Hệ thống áp dụng quy tắc kiểm tra cấp bậc:
     * Nếu chọn CĐCS (Level 1), cho phép thêm CĐBP hoặc Tổ trực thuộc CĐCS (Level 2).
     * Nếu chọn CĐBP (Level 2), chỉ cho phép thêm Tổ thuộc CĐBP (Level 3).
     * Nếu chọn Tổ công đoàn (Level 3), hệ thống ẩn hoặc disable nút "Thêm con".
  4. Tác nhân nhập tên đơn vị, liên kết Khối chuyên môn và lưu. Hệ thống lưu thành công.

## 2. UC_MEM_02: Chuyển sinh hoạt công đoàn (Điều động công tác)
* **Tác nhân**: Chủ tịch CĐCS, Chủ tịch CĐBP.
* **Luồng chính**:
  1. Tác nhân chọn đoàn viên cần chuyển và chọn chức năng "Chuyển sinh hoạt".
  2. Tác nhân chọn Tổ công đoàn đích (hệ thống tự lọc các Tổ công đoàn hoạt động). Nhập lý do chuyển, ngày hiệu lực và đính kèm quyết định điều động.
  3. Tác nhân bấm xác nhận.
  4. Hệ thống mở Database Transaction:
     * Kiểm tra tính hợp lệ của Tổ công đoàn đích.
     * Cập nhật `MaToCongDoan` của đoàn viên sang Tổ mới.
     * Tạo một bản ghi trong bảng `LichSuBienDong` ghi nhận chi tiết: Từ tổ cũ sang tổ mới, lý do, người thực hiện, file đính kèm.
     * Ghi Audit Log hành động.
     * Commit Transaction.
  5. Hệ thống hiển thị thông báo thành công. Số liệu thống kê đoàn số của các tổ chức liên quan tự động cập nhật theo thời gian thực.

## 3. UC_FIN_03: Đóng đoàn phí qua bảng lương
* **Tác nhân**: BCH CĐCS (Ban Tài chính).
* **Luồng chính**:
  1. Tác nhân tải file Excel bảng lương từ Phòng Tài chính bệnh viện lên hệ thống.
  2. Hệ thống đọc dữ liệu, đối chiếu số CCCD hoặc Mã nhân viên để tìm đoàn viên tương ứng.
  3. Tự động tính toán số tiền đóng (1% lương cơ bản) và tạo các bản ghi đóng đoàn phí với trạng thái `Đã hoàn thành`.
  4. Hệ thống cập nhật số dư tài khoản quỹ được trích lại 60% cho từng CĐBP và Tổ công đoàn tương ứng theo tỷ lệ quy định.
