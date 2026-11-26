# 10. API SPECIFICATION - ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API)

Hợp đồng dưới đây mô tả các luồng đã triển khai trong mã nguồn QLCD. Máy khách gọi `/api/v1` cùng origin. Với các yêu cầu ghi, lấy token từ `GET /api/v1/auth/csrf` và gửi `X-CSRF-Token` cùng cookie. [Chuẩn API](10_API_STANDARDS.md) · [Tổng quan phân hệ](PROJECT_OVERVIEW.md)

## Xác thực và quản trị tài khoản

| Endpoint | Hợp đồng đang dùng |
| --- | --- |
| `POST /api/v1/auth/login` | Nhận `username`, `password` và `activationCode` khi cần thiết lập Authenticator. Tài khoản đã có Authenticator nhận `202` với `data.challenge`. Tài khoản đang kích hoạt nhận phiên giới hạn và profile có `needsAuthenticator`. |
| `POST /api/v1/auth/login/authenticator` | Nhận `challenge` và `code` sáu chữ số. OTP hợp lệ cấp phiên. Mật khẩu tạm do Reset mật khẩu vẫn cần đổi trước khi vào nghiệp vụ. |
| `GET /api/v1/auth/session` | Đọc hồ sơ phiên. Các cờ `activationVerified`, `needsAuthenticator`, `mustChangePassword` và `recommendPasswordChange` điều khiển bước tiếp theo. |
| `POST /api/v1/auth/authenticator/setup` và `POST /api/v1/auth/authenticator/confirm` | Sau khi phiên giới hạn đã xác minh mã kích hoạt, gửi `{}` để lấy `data.qrImage` và `data.setup`. Gửi `setup` và `code` để hoàn tất. Backend cấp phiên mới và trả `data.codes` một lần. Đăng nhập lần đầu bằng mật khẩu mặc định hiện lời nhắc đổi mật khẩu. |
| `POST /api/v1/auth/change-password` | Nhận `currentPassword`, `newPassword`, `confirmPassword` và `code`. Thành công trả `204`, thu hồi phiên cũ và yêu cầu đăng nhập lại. |
| `POST /api/v1/auth/authenticator/recovery` và `POST /api/v1/auth/authenticator/recovery/confirm` | Dùng `challenge` và `recoveryCode` để nhận QR thay thế. Gửi `setup` và `code` để đăng ký thiết bị mới, thu hồi phiên cũ và nhận bộ mã khôi phục mới. Người dùng đăng nhập lại sau khi hoàn tất. |
| `GET /api/v1/accounts` | ADMIN đọc danh sách theo `search`, `page`, `pageSize`. Kết quả có `canResetCredentials`, `credentialPolicy` và `hasMore`. |
| `POST /api/v1/accounts/{id}/toggle` và `/unlock` | `toggle` xử lý khóa tài khoản. `unlock` yêu cầu `confirmed`, `currentPassword` và `code` mới của ADMIN, trả `accountActive`, `organizationRestored` và `organizationId`. Chính đơn vị liên kết có thể được khôi phục khi đơn vị cha đang hoạt động. |
| `POST /api/v1/accounts/{id}/activate` | ADMIN xác minh danh tính bằng `identityVerified` để cấp mã kích hoạt. |
| `POST /api/v1/accounts/{id}/reset-password` | ADMIN được chỉ định theo ID gửi `confirmed`, `currentPassword` và `code`. Thành công trả `204`, giữ Authenticator và thu hồi phiên cũ của tài khoản đích. |
| `POST /api/v1/accounts/{id}/reset-2fa` | ADMIN được chỉ định theo ID gửi `identityVerified`, `currentPassword` và `code`. Thành công trả `data.activationCode`, giữ mật khẩu và thu hồi phiên cũ của tài khoản đích. |

Khi bị khóa đăng nhập tạm thời, API trả `429`, mã `login_locked`, `retryAfterSeconds` và header `Retry-After`. Giới hạn theo IP có thể trả `429` riêng. Giao diện dùng `canResetCredentials` để hiển thị nút reset cho tài khoản khác. Quyền được kiểm tra lại ở API và handler. [Kiến trúc xác thực](AUTHENTICATION.md) · [Khôi phục tài khoản](ACCOUNT_RECOVERY.md)

## 1. Nhóm API: Quản lý Tổ chức (`/api/v1/union-units`)

### 1.1. Lấy cây tổ chức 3 cấp
* **GET** `/api/v1/union-units/tree`
* **Response**:
```json
{
  "success": true,
  "data": {
    "id": "c3b0ac02-2d12-4cf3-bf5e-bcbc7ffb39c0",
    "tenDonVi": "Công đoàn cơ sở mẫu",
    "loaiToChuc": "CDCS",
    "level": 1,
    "trangThai": 1,
    "soDoanVien": 40,
    "children": [
      {
        "id": "e4b0bc03-3d12-4cf4-cf5e-bcbc7ffb39d1",
        "tenDonVi": "Công đoàn bộ phận mẫu",
        "loaiToChuc": "CDBP",
        "level": 2,
        "trangThai": 1,
        "soDoanVien": 12,
        "children": [
          {
            "id": "f5c0cd04-4e13-5df5-df5e-bcbc7ffb39e2",
            "tenDonVi": "Tổ công đoàn mẫu",
            "loaiToChuc": "TO_CD_THUOC_CDBP",
            "level": 3,
            "trangThai": 1,
            "soDoanVien": 7,
            "children": []
          }
        ]
      }
    ]
  }
}
```

### 1.2. Thêm mới đơn vị
* **POST** `/api/v1/union-units`
* ADMIN hoặc CDCS phải chọn `maKhoi` của khối đang dùng. Cây trả thêm `maKhoi`, `tenKhoi` và `khoiDangSuDung` để giao diện nhóm các đơn vị cùng cha.
* **Request**:
```json
{
  "tenDonVi": "Tổ công đoàn Thận khớp",
  "loaiToChuc": "TO_CD_THUOC_CDBP",
  "maParent": "e4b0bc03-3d12-4cf4-cf5e-bcbc7ffb39d1",
  "maKhoi": "b2a0ab01-1c11-3be3-af5e-bcbc7ffb39b0"
}
```

### 1.3. Ngừng, khôi phục và phân loại đơn vị

- `DELETE /api/v1/union-units/{id}` chuyển đơn vị đủ điều kiện sang ngừng hoạt động. CĐCS và đơn vị có con bị từ chối. Dữ liệu và quan hệ theo ID được giữ.
- `GET /api/v1/union-units/inactive` cung cấp danh sách phân trang cho ADMIN/CDCS. `POST /api/v1/union-units/{id}/restore` khôi phục đơn vị cùng ID khi cha đang hoạt động. Việc mở cờ khóa của tài khoản cần thao tác quản trị riêng.
- `GET /api/v1/management-blocks` là nguồn lựa chọn khối. `POST /api/v1/management-blocks` và `PUT /api/v1/management-blocks/{id}` dành cho ADMIN. Trạng thái ngừng dùng giữ các liên kết hiện tại. [Vòng đời và quy tắc Khối quản lý](03-Business-Rules.md)

---

## 2. Nhóm API: Biến động đoàn viên (`/api/v1/union-members`)

### 2.1. Chuyển sinh hoạt đoàn viên
* **POST** `/api/v1/union-members/{id}/transfer`
* **Request**:
```json
{
  "denToCongDoanId": "f5c0cd04-4e13-5df5-df5e-bcbc7ffb39e2",
  "lyDo": "Thay đổi vị trí công tác chuyên môn tại bệnh viện",
  "ngayHieuLuc": "2026-06-25",
  "fileMinhChungUrl": "d4c0cd04-3e12-4cf4-bf5e-bcbc7ffb39c0"
}
```

---

Nếu có minh chứng, giá trị `fileMinhChungUrl` là GUID do API tải lên PDF trả về. Backend kiểm quyền, người tải, module và đơn vị trước khi gắn tệp.

## 3. Thiết kế dự kiến cho điểm danh bằng QR Code

Ví dụ ở phần này thuộc đề xuất nghiệp vụ. `ActivitiesController` hiện có các thao tác danh sách, tạo, sửa và xóa hoạt động.

### 3.1. Điểm danh Check-in sự kiện
* **POST** `/api/v1/activities/{id}/check-in`
* **Request**:
```json
{
  "qrCodeToken": "TOKEN-ACT-108-XXXX",
  "doanVienId": "d4c0cd04-3e12-4cf4-bf5e-bcbc7ffb39c0"
}
```
* **Response**:
```json
{
  "success": true,
  "message": "Điểm danh tham gia sự kiện thành công",
  "data": {
    "doanVienId": "d4c0cd04-3e12-4cf4-bf5e-bcbc7ffb39c0",
    "hoTen": "Nguyễn Văn A",
    "checkInTime": "2026-06-21T08:15:22"
  }
}
```
