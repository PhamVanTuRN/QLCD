# 10. API STANDARDS - CHUẨN THIẾT KẾ API

Tài liệu này quy định các tiêu chuẩn kỹ thuật thiết kế và triển khai API giữa Backend và Frontend của dự án QLCD.

## 1. Thiết kế URL RESTful
* Tất cả URL của các điểm cuối API phải sử dụng danh từ số nhiều ở dạng tiếng Anh hoặc tiếng Việt không dấu thống nhất (Khuyến nghị dùng tiếng Anh để đồng bộ kỹ thuật tốt hơn).
* Sử dụng chữ thường, ngăn cách bằng dấu gạch ngang (kebab-case).
* Tiền tố API: `/api/v1/`

Ví dụ:
* Lấy danh sách đoàn viên: `GET /api/v1/union-members`
* Lấy chi tiết một đoàn viên: `GET /api/v1/union-members/{id}`
* Tạo mới một đề xuất phúc lợi: `POST /api/v1/welfare-requests`
* Cập nhật trạng thái đóng đoàn phí: `PUT /api/v1/union-fees/{id}/status`

## 2. Các phương thức HTTP (HTTP Methods)
* `GET`: Dùng để truy vấn lấy dữ liệu. Không thay đổi trạng thái hệ thống.
* `POST`: Dùng để tạo mới bản ghi dữ liệu.
* `PUT`: Dùng để cập nhật toàn bộ bản ghi hoặc các trường thông tin chính.
* `PATCH`: Dùng để cập nhật một vài trường cụ thể (ví dụ cập nhật trạng thái duyệt).
* `DELETE`: Dùng để xóa bản ghi (Khuyến khích xóa mềm - Soft Delete).

## 3. Cấu trúc Response chuẩn
Hệ thống sử dụng một định dạng JSON Response đồng nhất cho toàn bộ các API:

### Trường hợp thành công (HTTP Status 200/201)
```json
{
  "success": true,
  "message": "Thao tác thực hiện thành công",
  "data": {
    "id": "c3b0ac02-2d12-4cf3-bf5e-bcbc7ffb39c0",
    "maDoanVien": "DV-108-0001",
    "hoTen": "Nguyễn Văn A"
  },
  "errors": null
}
```

### Trường hợp lỗi (HTTP Status 400/401/403/404/500)
```json
{
  "success": false,
  "message": "Dữ liệu gửi lên không hợp lệ hoặc không đủ quyền",
  "data": null,
  "errors": [
    {
      "field": "Email",
      "message": "Định dạng email không hợp lệ"
    }
  ]
}
```

## 4. Các mã trạng thái HTTP sử dụng (HTTP Status Codes)
* `200 OK`: Request thành công, dữ liệu trả về nằm trong trường `data`.
* `201 Created`: Tạo mới thành công (thường dùng cho POST).
* `400 Bad Request`: Lỗi dữ liệu đầu vào không hợp lệ hoặc vi phạm Business Rules. Chi tiết lỗi mô tả ở danh sách `errors`.
* `401 Unauthorized`: Người dùng chưa xác thực (token hết hạn hoặc không có token).
* `403 Forbidden`: Người dùng đã xác thực nhưng không có quyền truy cập vào chức năng hoặc tài nguyên tương ứng.
* `404 Not Found`: Không tìm thấy tài nguyên yêu cầu.
* `500 Internal Server Error`: Lỗi phát sinh từ phía server (lỗi logic code, mất kết nối DB...).

## 5. Phân trang và Sắp xếp (Pagination & Sorting)
Khi truy vấn danh sách lớn (như danh sách 2000 đoàn viên), bắt buộc sử dụng phân trang:
* Các tham số truyền vào Query String: `pageNumber` (mặc định 1), `pageSize` (mặc định 10 hoặc 20), `sortBy` (trường cần sắp xếp), `sortOrder` (`asc` hoặc `desc`).
* Dữ liệu phân trang trả về trong `data` bao gồm:
```json
{
  "items": [],
  "pageNumber": 1,
  "pageSize": 10,
  "totalItems": 2045,
  "totalPages": 205
}
```
