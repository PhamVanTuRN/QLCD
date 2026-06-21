# 10. API SPECIFICATION - ĐẶC TẢ GIAO DIỆN LẬP TRÌNH ỨNG DỤNG (API)

Tài liệu này định nghĩa chi tiết các API endpoints nghiệp vụ bổ sung phục vụ cho các module nâng cấp.

## 1. Nhóm API: Quản lý Tổ chức (`/api/v1/union-units`)

### 1.1. Lấy cây tổ chức 3 cấp
* **GET** `/api/v1/union-units/tree`
* **Response**:
```json
{
  "success": true,
  "data": {
    "id": "c3b0ac02-2d12-4cf3-bf5e-bcbc7ffb39c0",
    "name": "Công đoàn cơ sở Bệnh viện TWQĐ 108",
    "type": "CDCS",
    "level": 1,
    "memberCount": 2045,
    "children": [
      {
        "id": "e4b0bc03-3d12-4cf4-cf5e-bcbc7ffb39d1",
        "name": "Công đoàn bộ phận Khối Nội 1",
        "type": "CDBP",
        "level": 2,
        "memberCount": 150,
        "children": [
          {
            "id": "f5c0cd04-4e13-5df5-df5e-bcbc7ffb39e2",
            "name": "Tổ công đoàn Tiêu hóa",
            "type": "TO_CD_THUOC_CDBP",
            "level": 3,
            "memberCount": 45,
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
* **Request**:
```json
{
  "tenDonVi": "Tổ công đoàn Thận khớp",
  "loaiToChuc": "TO_CD_THUOC_CDBP",
  "maParent": "e4b0bc03-3d12-4cf4-cf5e-bcbc7ffb39d1",
  "maKhoi": "b2a0ab01-1c11-3be3-af5e-bcbc7ffb39b0"
}
```

---

## 2. Nhóm API: Biến động đoàn viên (`/api/v1/union-members`)

### 2.1. Đề xuất chuyển sinh hoạt đoàn viên
* **POST** `/api/v1/union-members/{id}/transfer`
* **Request**:
```json
{
  "denToCongDoanId": "f5c0cd04-4e13-5df5-df5e-bcbc7ffb39e2",
  "lyDo": "Thay đổi vị trí công tác chuyên môn tại bệnh viện",
  "ngayHieuLuc": "2026-06-25",
  "fileMinhChungUrl": "https://storage.bv108.vn/quyet-dinh-dieu-dong-108.pdf"
}
```

---

## 3. Nhóm API: Điểm danh hoạt động bằng QR Code (`/api/v1/activities`)

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
