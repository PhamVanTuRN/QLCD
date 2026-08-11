# PROJECT VISION: PHẦN MỀM QUẢN LÝ ĐIỂM DANH

## 1. Tầm nhìn
**Phần mềm Quản lý điểm danh (AttendanceManagement)** là hệ thống quản lý:
- Sự kiện (Event)
- Địa điểm / Hội trường (Location)
- Thiết bị điểm danh, Camera (AttendanceDevice)
- Quy tắc điểm danh (AttendanceRule) và Khung giờ điểm danh (AttendanceWindow)
- Người tham dự (Participant)
- Lịch sử điểm danh gốc (AttendanceLog)
- Kết quả điểm danh (AttendanceResult)
- Danh sách tham dự
- Báo cáo thống kê
- Tích hợp với hệ thống Huấn luyện Đào tạo (HLĐT)
- Phục vụ cấp chứng chỉ liên tục (CME) trong tương lai.

Hệ thống được thiết kế linh hoạt, đáp ứng khả năng một sự kiện có thể diễn ra tại nhiều địa điểm, và một địa điểm có thể phục vụ nhiều sự kiện khác nhau, thông qua nhiều phương thức điểm danh khác nhau.

## 2. Mục tiêu chính
1. **Tự động hóa ghi nhận tham dự:** Hỗ trợ kết nối với nhiều nguồn như nhận diện khuôn mặt (Camera AI), quét mã QR, thẻ từ, hoặc điểm danh thủ công.
2. **Giảm điểm danh thủ công:** Rút ngắn thời gian quản lý, loại bỏ sai sót do con người.
3. **Tổng hợp chính xác kết quả:** Tính toán kết quả điểm danh hoàn toàn dựa trên quy tắc (Rule) và khung giờ (Window) cấu hình trước cho từng sự kiện.
4. **Bảo toàn dữ liệu điểm danh gốc:** Toàn bộ lịch sử điểm danh (Log) từ các thiết bị đều được lưu trữ gốc, không bị sửa đổi hay xóa bỏ. Kết quả điểm danh chỉ là quá trình tính toán trên lịch sử gốc.
5. **Cấu hình linh hoạt:** Cho phép mỗi sự kiện tự định nghĩa các quy tắc và khung thời gian điểm danh riêng biệt mà không ảnh hưởng đến sự kiện khác.
6. **Sẵn sàng tích hợp:** Cung cấp API và cơ chế đồng bộ liền mạch với các hệ thống sẵn có (như phần mềm Quản lý Huấn luyện Đào tạo) thông qua CCCD hoặc định danh chung.
