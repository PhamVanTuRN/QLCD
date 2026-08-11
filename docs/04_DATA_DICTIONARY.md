# DATA DICTIONARY

Tài liệu mô tả từ điển dữ liệu của các thực thể chính.

## 1. User & Profile
**UserAccount**
- `Id`: Guid, PK
- `Username`: String, Req. Tên đăng nhập.
- `Email`: String.
- `PasswordHash`: String, Req.
- `Role`: String, Req. VD: Admin, Organizer, Viewer.
- `OrganizationUnitId`: Guid, FK, Nullable. Đơn vị công tác.

**Person (Người tham dự)**
- `Id`: Guid, PK.
- `FullName`: String, Req.
- `CCCD`: String, Index, Unique. Business key liên kết HLĐT.
- `Email`: String.
- `Phone`: String.

## 2. OrganizationUnit
**OrganizationUnit**
- `Id`: Guid, PK.
- `Name`: String, Req. Tên khoa/phòng/đơn vị.
- `ParentId`: Guid, FK, Nullable. Cấu trúc cây đơn vị.

## 3. Event & Location
**Event**
- `Id`: Guid, PK.
- `Code`: String, Req, Unique. Mã sự kiện.
- `Name`: String, Req.
- `StartTime`: DateTime, Req.
- `EndTime`: DateTime, Req.
- `Description`: String.

**Location**
- `Id`: Guid, PK.
- `Name`: String, Req.
- `Capacity`: Integer.
- `LocationType`: String. Hội trường, phòng họp, v.v.

**EventLocation**
- `EventId`: Guid, FK, PK.
- `LocationId`: Guid, FK, PK.
- Bảng trung gian thể hiện quan hệ N:N giữa Event và Location.

## 4. AttendanceDevice
**AttendanceDevice**
- `Id`: Guid, PK.
- `Name`: String, Req.
- `DeviceType`: String, Req. CAMERA, RFID, QR_SCANNER.
- `LocationId`: Guid, FK. Thiết bị này đặt ở đâu.
- `IpAddress`: String.
- `MacAddress`: String.

## 5. Attendance Configurations
**AttendanceRule**
- `Id`: Guid, PK.
- `EventId`: Guid, FK.
- `MinimumRequiredCheckpoints`: Int. Số lần quét tối thiểu.
- `MinimumDurationMinutes`: Int. Thời lượng có mặt tối thiểu.
- `IsActive`: Bool.

**AttendanceWindow**
- `Id`: Guid, PK.
- `EventId`: Guid, FK.
- `Name`: String. VD "Check-in Sáng".
- `StartTime`: DateTime.
- `EndTime`: DateTime.
- `Required`: Bool. Có bắt buộc phải điểm danh trong khung giờ này hay không.
- `MinimumCount`: Int. Số lượng log tối thiểu cần có trong khung giờ này.

## 6. Logs & Results
**RawAttendanceLog**
- `Id`: Guid, PK.
- `PersonId`: Guid, FK, Nullable. Xác định được ai điểm danh.
- `CCCD`: String. CCCD điểm danh (nếu thiết bị đẩy trực tiếp mã số).
- `EventId`: Guid, FK, Nullable. (Có thể null nếu hệ thống chưa suy luận ra sự kiện).
- `LocationId`: Guid, FK.
- `DeviceId`: Guid, FK.
- `AttendanceTime`: DateTime, Req. Thời điểm quẹt thẻ/chụp ảnh.
- `AttendanceMethod`: String, Req. FACE, RFID, QR.
- `RecognitionScore`: Decimal, Nullable. (Độ chính xác khuôn mặt).
- `IsValid`: Bool. Hợp lệ không (tính toán sau khi nhận).
- `ValidationMessage`: String. Lý do không hợp lệ.
- `RawPayload`: String. JSON đẩy từ thiết bị, phục vụ trace.

**AttendanceResult**
- `Id`: Guid, PK.
- `EventId`: Guid, FK.
- `PersonId`: Guid, FK, Nullable.
- `CCCD`: String.
- `AttendanceStatus`: String, Req. (PENDING, PRESENT, ABSENT, INCOMPLETE, LATE, EARLY_LEAVE, INVALID, MANUAL_APPROVED).
- `FirstAttendanceTime`: DateTime, Nullable.
- `LastAttendanceTime`: DateTime, Nullable.
- `TotalLogs`: Int. Tổng số log quét được.
- `ValidLogs`: Int. Tổng số log hợp lệ.
- `CompletedRequiredWindows`: Int. Số khung giờ đã điểm danh thành công.
- `RequiredWindows`: Int. Số khung giờ yêu cầu theo cấu hình.
- `CalculatedAt`: DateTime. Thời điểm tính toán.
- `IsManualOverride`: Bool. Đã bị sửa thủ công chưa.
- `ManualOverrideReason`: String. Lý do sửa.
