# 14. TEST PLAN - KẾ HOẠCH KIỂM THỬ NGHIỆP VỤ BẮT BUỘC

Tài liệu này định nghĩa chi tiết các kịch bản kiểm thử (Test Cases) nhằm xác minh các Business Rules khắt khe về cấu trúc tổ chức và biến động của hệ thống QLCD BV108.

## 1. Kịch bản Test 1: Ràng buộc duy nhất CĐCS
* **Mã test**: `TC_VAL_01`
* **Mục tiêu**: Đảm bảo hệ thống chặn mọi nỗ lực tạo bản ghi CĐCS thứ hai.
* **Các bước**:
  1. Gửi request tạo mới một đơn vị công đoàn với `LoaiToChuc = CDCS` (trong khi database đã có sẵn 1 bản ghi CĐCS).
* **Kết quả kỳ vọng**:
  * API trả về lỗi `400 Bad Request`.
  * Nội dung lỗi: "Hệ thống chỉ được phép tồn tại duy nhất 01 Công đoàn Cơ sở."

## 2. Kịch bản Test 2: Ràng buộc không có cấp con dưới Tổ công đoàn
* **Mã test**: `TC_VAL_02`
* **Mục tiêu**: Chặn hành động tạo đơn vị con dưới một Tổ công đoàn.
* **Các bước**:
  1. Lấy ID của một Tổ công đoàn (Level 3 hoặc Tổ trực thuộc CĐCS).
  2. Gửi request tạo mới một đơn vị công đoàn con với `MaParent` là ID của Tổ công đoàn này.
* **Kết quả kỳ vọng**:
  * API trả về lỗi `400 Bad Request`.
  * Nội dung lỗi: "Không được phép tạo đơn vị con dưới cấp Tổ công đoàn (Level 3/Nút lá)."

## 3. Kịch bản Test 3: Ràng buộc cấp CĐBP con
* **Mã test**: `TC_VAL_03`
* **Mục tiêu**: Chặn hành động tạo CĐBP con dưới một CĐBP.
* **Các bước**:
  1. Gửi request tạo mới một CĐBP với `MaParent` là ID của một CĐBP khác.
* **Kết quả kỳ vọng**:
  * API trả về lỗi `400 Bad Request`.
  * Nội dung lỗi: "Công đoàn bộ phận chỉ được phép trực thuộc trực tiếp Công đoàn Cơ sở (Level 1)."

## 4. Kịch bản Test 4: Chuyển sinh hoạt đoàn viên trong Transaction
* **Mã test**: `TC_VAL_04`
* **Mục tiêu**: Đảm bảo số liệu thống kê tự động cập nhật chính xác và an toàn.
* **Các bước**:
  1. Đăng ký đoàn viên X thuộc Tổ A (số đoàn viên Tổ A là 10, Tổ B là 5).
  2. Thực hiện command điều động đoàn viên X sang Tổ B.
* **Kết quả kỳ vọng**:
  * Số lượng đoàn viên Tổ A giảm xuống còn 9.
  * Số lượng đoàn viên Tổ B tăng lên thành 6.
  * Xuất hiện 1 bản ghi trong lịch sử biến động.
  * Trong trường hợp xảy ra lỗi mạng giữa chừng, toàn bộ thay đổi phải được Rollback.
