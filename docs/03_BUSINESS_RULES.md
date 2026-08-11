# BUSINESS RULES

Tài liệu này liệt kê các quy tắc nghiệp vụ (Business Rules) áp dụng trong toàn hệ thống.

**BR-001: Sự kiện ở nhiều địa điểm**  
Một `Event` có thể diễn ra tại nhiều `Location` cùng lúc (ví dụ: hội trường chính và hội trường phụ).

**BR-002: Địa điểm dùng cho nhiều sự kiện**  
Một `Location` có thể được sử dụng cho nhiều `Event` khác nhau trong các khoảng thời gian khác nhau.

**BR-003: Địa điểm lắp nhiều thiết bị**  
Một `Location` có thể có nhiều `AttendanceDevice` (ví dụ: Camera cửa trước, Camera cửa sau).

**BR-004: Lịch sử điểm danh (Log) là bất biến**  
`AttendanceLog` là dữ liệu gốc được nhận từ thiết bị. Log này là bất biến (immutable) và không bao giờ được xóa/sửa đổi bởi user thông thường, ngay cả khi log đó là invalid. Nếu log sai, nó chỉ bị bỏ qua trong quá trình tính kết quả, nhưng dữ liệu vật lý vẫn còn đó để audit.

**BR-005: Kết quả điểm danh được tính toán**  
`AttendanceResult` không phải là bản ghi được user nhập vào (trừ trường hợp Manual Override). Kết quả này được tự động tính toán từ `AttendanceLog` thông qua các `AttendanceRule` và `AttendanceWindow`.

**BR-006: Khung giờ điểm danh**  
Một `Event` có thể yêu cầu một hoặc nhiều `AttendanceWindow` (ví dụ: Khung giờ sáng, Khung giờ chiều). Mỗi window có thời gian bắt đầu, kết thúc, và cờ `Required`.

**BR-007: Khóa ngoại tích hợp hệ thống ngoài**  
`CCCD` (Căn cước công dân) là business key để liên kết định danh (Person/User) giữa hệ thống điểm danh và hệ thống Huấn luyện Đào tạo (HLĐT). Khi nhận diện bằng khuôn mặt, camera sẽ đẩy log kèm mã ID của người dùng, mã này được mapping sang CCCD.

**BR-008: Xác định Event từ Log của Device**  
Nếu một Device đẩy log về hệ thống chỉ có thông tin (DeviceId, Time, User), hệ thống phải có khả năng suy ra sự kiện hiện tại bằng cách tìm `Location` chứa Device đó, và tìm `Event` đang diễn ra tại Location đó trong khoảng thời gian `Time`.

**BR-009: Xử lý sự kiện nhập nhằng (Ambiguous Event)**  
Nếu từ BR-008 có nhiều `Event` cùng thỏa mãn (ví dụ: hai sự kiện cùng gán chung một Location ở cùng một khung giờ), hệ thống không tự ý gán bừa log cho một Event nào cả. Nó phải đánh dấu log này là `ambiguous` hoặc lưu lại với EventId = NULL để quản trị viên xử lý thủ công, hoặc cần có logic bổ sung.

**BR-010: Ghi đè thủ công (Manual Override)**  
Nếu quản trị viên thực hiện chỉnh sửa kết quả điểm danh thủ công (Manual Override) thành "PRESENT" hoặc "ABSENT", hành động này phải kích hoạt cờ `IsManualOverride = true` trong `AttendanceResult` và bắt buộc nhập lý do (`ManualOverrideReason`). Phải lưu lại nhật ký thay đổi (Audit Log).

**BR-011: Tính toán lại (Recalculation)**  
Khi có sự thay đổi về `AttendanceRule` hoặc `AttendanceWindow` (ví dụ: kéo dài thời gian điểm danh thêm 15 phút), quản trị viên có quyền bấm nút "Recalculate". Hệ thống sẽ quét lại toàn bộ `AttendanceLog` để tính toán lại kết quả. Những bản ghi đã bị `IsManualOverride` sẽ bị bỏ qua trong quá trình tính lại (giữ nguyên kết quả thủ công).
