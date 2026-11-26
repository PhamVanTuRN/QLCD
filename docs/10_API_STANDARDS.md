# 10. API STANDARDS - CHUẨN THIẾT KẾ API

Tài liệu này quy định các tiêu chuẩn kỹ thuật thiết kế và triển khai API giữa Backend và Frontend của dự án QLCD.

## 1. Thiết kế URL RESTful
* Tất cả URL của các điểm cuối API phải sử dụng danh từ số nhiều ở dạng tiếng Anh hoặc tiếng Việt không dấu thống nhất (Khuyến nghị dùng tiếng Anh để đồng bộ kỹ thuật tốt hơn).
* Sử dụng chữ thường, ngăn cách bằng dấu gạch ngang (kebab-case).
* Tiền tố API: `/api/v1/`

Ví dụ:
* Lấy danh sách đoàn viên: `GET /api/v1/union-members`
* Lấy chi tiết một đoàn viên: `GET /api/v1/union-members/{id}`
* Tạo mới một đề xuất phúc lợi: `POST /api/v1/welfare`
* Cập nhật giao dịch đoàn phí: `PUT /api/v1/finance/{id}`

## 2. Các phương thức HTTP (HTTP Methods)
* `GET` đọc dữ liệu. Backend có thể ghi audit cho lượt đọc nhạy cảm.
* `POST` tạo bản ghi hoặc thực hiện thao tác nghiệp vụ như chuyển sinh hoạt, cấp mã hay khôi phục.
* `PUT` cập nhật theo hợp đồng hiện có. ID trong DTO phải khớp ID của route khi API yêu cầu.
* `DELETE` theo quy tắc từng phân hệ. Với đơn vị, thao tác chuyển trạng thái ngừng hoạt động, giữ ID và các liên kết.

## 3. Cấu trúc Response chuẩn
Giữ hợp đồng của từng endpoint v1. Phản hồi JSON thông thường dùng `success` và `data`. Tra từng thao tác trong [Đặc tả API v1](10-API-Specification.md).

### Ví dụ thành công với HTTP 200
```json
{
  "success": true,
  "data": "c3b0ac02-2d12-4cf3-bf5e-bcbc7ffb39c0"
}
```

### Ví dụ lỗi chuẩn hóa
```json
{
  "success": false,
  "status": 403,
  "message": "Bạn không có quyền thực hiện thao tác này.",
  "traceId": "fixture-trace"
}
```

## 4. Các mã trạng thái HTTP sử dụng (HTTP Status Codes)
* `200 OK`: Request thành công, dữ liệu trả về nằm trong trường `data`.
* `202 Accepted` bắt đầu thử thách OTP cho tài khoản đã thiết lập Authenticator. `204 No Content` là kết quả của một số thao tác như Reset mật khẩu.
* `400 Bad Request` cho yêu cầu hoặc dữ liệu không hợp lệ. Dùng `message` theo hợp đồng endpoint.
* `401 Unauthorized` khi thiếu phiên hợp lệ hoặc bước xác thực bị từ chối.
* `403 Forbidden`: Người dùng đã xác thực nhưng không có quyền truy cập vào chức năng hoặc tài nguyên tương ứng.
* `404 Not Found`: Không tìm thấy tài nguyên yêu cầu.
* `409 Conflict` khi trạng thái nghiệp vụ xung đột hoặc bản ghi đã đổi đồng thời.
* `429 Too Many Requests` khi vượt giới hạn. Với khóa đăng nhập, đọc `retryAfterSeconds` hoặc `Retry-After`.
* `500 Internal Server Error` cho lỗi ngoài dự kiến và `503 Service Unavailable` khi dịch vụ dữ liệu gián đoạn. Dùng thông báo an toàn, giữ chi tiết chẩn đoán ở backend.

## 5. Phân trang và Sắp xếp (Pagination & Sorting)
Danh sách dùng `page` và `pageSize` với thứ tự ổn định theo endpoint. `PageBounds` dùng mặc định 50 và tối đa 200 cho các endpoint dùng helper này. Lọc theo quyền và tìm kiếm trước phân trang. Các danh sách dùng `data` và `hasMore` theo hợp đồng. Đoàn viên trả dạng sau trong `data`.
```json
{
  "items": [],
  "page": 1,
  "pageSize": 50,
  "totalCount": 0
}
```

## 6. Phiên và phân quyền

API dùng cookie HttpOnly cùng origin. Backend lấy vai trò và đơn vị từ phiên hiện hành, kiểm tra quyền chức năng và đối tượng trong controller hoặc handler. Các yêu cầu ghi cần `X-CSRF-Token`. Giữ `Cache-Control: no-store` cho API. [Kiến trúc xác thực](AUTHENTICATION.md)
