# GAP ANALYSIS

Báo cáo Gap Analysis đánh giá mức độ khác biệt giữa thiết kế nghiệp vụ của hệ thống (Docs) và tình trạng thực tế của mã nguồn hiện hành (Source Code).

## 1. Gap 1: Event - Location (N:N)
- **REQUIREMENT:** Một Event có thể diễn ra tại nhiều Location. Quan hệ N:N thông qua bảng `EventLocations`.
- **CURRENT IMPLEMENTATION:** Đã triển khai. Bảng `EventLocation` đã được thiết lập trong EF Core, và module Application đã hỗ trợ `EventLocationDto`.
- **STATUS:** COMPLIANT.
- **MISSING:** Không.
- **ACTION:** Không cần hành động thêm ở Backend, cần đảm bảo UI cho phép đa chọn Location khi tạo Event.

## 2. Gap 2: Raw Attendance Log Validation
- **REQUIREMENT:** Chống duplicate log, hoặc đánh dấu IsValid = false nếu 2 log quá gần nhau.
- **CURRENT IMPLEMENTATION:** `ReceiveAttendanceLogCommand` hiện tại đang chèn thẳng bản ghi vào database mà không có kiểm tra duplicate hoặc khoảng thời gian (debounce).
- **STATUS:** PARTIALLY COMPLIANT.
- **MISSING:** Logic Debounce log trong Backend.
- **ACTION:** Cần nâng cấp `ReceiveAttendanceLogCommandHandler` để kiểm tra log gần nhất của cùng Person/CCCD tại cùng DeviceId. Nếu cách nhau dưới N giây (VD: 10 giây) thì có thể bỏ qua hoặc lưu IsValid=false.

## 3. Gap 3: Device -> Event Mapping
- **REQUIREMENT:** Khi nhận Log chỉ có DeviceId, hệ thống tự động suy ra EventId (UC-008).
- **CURRENT IMPLEMENTATION:** Trong `ReceiveAttendanceLogCommand`, `EventId` đang là tham số bắt buộc truyền từ Client. Hệ thống chưa tự động suy diễn `EventId` từ `DeviceId` và `Time`.
- **STATUS:** NOT COMPLIANT.
- **MISSING:** Dịch vụ xác định Event tự động dựa trên thời gian thực.
- **ACTION:** Xóa bỏ yêu cầu `EventId` bắt buộc trong Payload nhận Log. Thêm logic tìm kiếm `Location` của Device -> tìm `Event` đang diễn ra tại Location -> gán `EventId`.

## 4. Gap 4: Frontend Implementation
- **REQUIREMENT:** Các màn hình quản lý theo UI/UX Guidelines.
- **CURRENT IMPLEMENTATION:** Frontend Next.js hiện đang hiển thị giao diện của hệ thống cũ (chưa được refactor hoàn chỉnh các trang CRUD cho Event, Location, Log, Result).
- **STATUS:** NOT COMPLIANT.
- **MISSING:** Toàn bộ Pages và Components của Frontend.
- **ACTION:** Phát triển giai đoạn Phase 9 (Frontend CRUD).
