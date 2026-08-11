# API SPECIFICATION

Tài liệu này mô tả danh sách các API chính của hệ thống. API được xây dựng theo chuẩn RESTful trên nền tảng .NET Core API, sử dụng pattern CQRS với MediatR.

## 1. Events API
- `GET /api/events`: Lấy danh sách sự kiện (có phân trang).
- `GET /api/events/{id}`: Xem chi tiết sự kiện.
- `POST /api/events`: Tạo sự kiện.
- `PUT /api/events/{id}`: Cập nhật sự kiện.
- `DELETE /api/events/{id}`: Xóa sự kiện.
- `POST /api/events/{id}/locations`: Gán Location cho Event.
- `DELETE /api/events/{id}/locations/{locationId}`: Xóa Location khỏi Event.

## 2. Locations API
- `GET /api/locations`: Lấy danh sách địa điểm.
- `GET /api/locations/{id}`: Xem chi tiết.
- `POST /api/locations`: Tạo mới.
- `PUT /api/locations/{id}`: Cập nhật.
- `DELETE /api/locations/{id}`: Xóa.

## 3. Devices API
- `GET /api/devices`: Lấy danh sách thiết bị.
- `POST /api/devices`: Tạo thiết bị.
- `PUT /api/devices/{id}`: Cập nhật thông tin thiết bị (IP, Mac, Location).

## 4. Attendance Configurations API
- `GET /api/attendancerules`: Lấy danh sách rule.
- `POST /api/attendancerules`: Tạo rule.
- `GET /api/attendancewindows`: Lấy danh sách window.
- `POST /api/attendancewindows`: Tạo window.

## 5. Attendance Logs API
- `POST /api/attendancelogs/receive`: Endpoint để các thiết bị Camera/Máy quẹt thẻ gọi vào để gửi Log.
- `GET /api/attendancelogs`: Lấy danh sách Raw Logs. (Không có PUT/DELETE).

## 6. Attendance Results API
- `GET /api/attendanceresults`: Xem danh sách kết quả điểm danh.
- `POST /api/attendanceresults/calculate/{eventId}`: Kích hoạt tính toán lại toàn bộ kết quả của 1 sự kiện.
- `PUT /api/attendanceresults/{id}/override`: Ghi đè thủ công kết quả (Manual Override).

## 7. Format chung
**Response Paging:**
```json
{
  "items": [],
  "totalCount": 100,
  "pageIndex": 1,
  "pageSize": 10
}
```

**Response Error:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Code": ["Mã sự kiện không được để trống"]
  }
}
```
