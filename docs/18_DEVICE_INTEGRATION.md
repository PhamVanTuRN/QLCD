# DEVICE INTEGRATION

Hướng dẫn tích hợp các nguồn thiết bị vật lý với hệ thống Điểm danh.

## 1. Phương thức hỗ trợ (AttendanceMethod)
- `FACE`: Camera nhận diện khuôn mặt.
- `RFID`: Máy quẹt thẻ từ.
- `QR`: Máy quét mã QR (hoặc mobile app).
- `MANUAL`: Điểm danh bằng tay trên giao diện web.
- `IMPORT`: Import file Excel.

## 2. Luồng tích hợp chuẩn
Bất kể thiết bị vật lý là gì, các Service trung gian hoặc Gateway nội bộ phải gửi Request về API chuẩn của hệ thống:

**Endpoint:** `POST /api/attendancelogs/receive`

**Payload:**
```json
{
  "deviceId": "guid-thiet-bi",
  "cccd": "001090123456",
  "attendanceTime": "2026-08-11T07:30:00Z",
  "attendanceMethod": "FACE",
  "recognitionScore": 95.5,
  "rawPayload": "{ \"camId\": 12, \"match\": true }"
}
```

## 3. Mapping Event tự động
Khi hệ thống nhận được request trên, nó sẽ:
1. Lookup `DeviceId` -> `LocationId` (Thiết bị này đặt ở đâu).
2. Lookup `LocationId` -> Các `Event` đang diễn ra tại thời điểm `AttendanceTime`.
3. Nếu tìm thấy duy nhất 1 Event -> gán `EventId` vào `RawAttendanceLog`.
4. Nếu tìm thấy 0 Event -> gán `EventId` = NULL, lưu trạng thái Invalid (không có sự kiện diễn ra).
5. Nếu tìm thấy > 1 Event -> gán `EventId` = NULL, trạng thái là `Ambiguous`.
