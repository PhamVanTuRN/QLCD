# Hệ thống Quản lý Điểm danh (Attendance Management)

Hệ thống quản lý điểm danh sự kiện, hội nghị trực tuyến thời gian thực, thiết kế riêng cho Bệnh viện Trung ương Quân đội 108. Hệ thống hỗ trợ xử lý số lượng lớn dữ liệu điểm danh, quản lý nhiều địa điểm (hội trường) cùng lúc và tích hợp linh hoạt với các thiết bị nhận diện.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Backend API
- **Core:** .NET 8 (ASP.NET Core Web API)
- **Database Access:** Entity Framework Core (EF Core)
- **DBMS:** SQL Server
- **Architecture Pattern:** Clean Architecture kết hợp CQRS (Command Query Responsibility Segregation) sử dụng thư viện **MediatR**
- **Security:** JWT Authentication & Role-Based Authorization

### 2. Frontend Web App
- **Core Framework:** Next.js (React) 16.x
- **Styling:** TailwindCSS & Vanilla CSS
- **Icons:** Lucide Icons
- **Biểu đồ:** Recharts

---

## 🌟 Tính năng chính

1. **Dashboard Tổng quan:**
   - Xem nhanh số lượng sự kiện đang diễn ra, số lượng địa điểm, tổng số người tham dự.
   - Thống kê tỷ lệ tham gia theo tiêu chí (Có mặt, Vắng mặt, Thiếu lượt).
2. **Quản lý Sự kiện & Địa điểm:**
   - Hỗ trợ nhiều địa điểm cho một sự kiện (N:N thông qua `EventLocation`).
   - Gắn kết thiết bị nhận dạng (Camera/Máy quét) theo Địa điểm, tự động phân tích và gán bản ghi điểm danh (Raw Logs) cho sự kiện hiện hành.
3. **Luật điểm danh (Attendance Rules):**
   - Hỗ trợ điểm danh 1 lần, nhiều lần (check-in/check-out).
   - Thiết lập các khung giờ (Windows) hợp lệ cho mỗi lần điểm danh.
4. **Xử lý Dữ liệu thô (Raw Logs):**
   - Các bản ghi thô từ thiết bị gửi về là **bất biến**, hệ thống tự động lọc trùng lặp (debounce).
   - Engine tính toán riêng biệt (`AttendanceCalculationService`) sẽ quét logs để cho ra **Kết quả điểm danh (Result)** cuối cùng.
5. **Cơ chế Tích hợp:**
   - Sử dụng **CCCD** làm Business Key chính để sẵn sàng tích hợp với Hệ thống Quản lý Huấn luyện Đào tạo (HLĐT) hoặc các hệ thống khác của Bệnh viện.

---

## 📁 Cấu trúc thư mục

```text
AttendanceManagement/
├── backend/                              # Mã nguồn dự án Backend (.NET 8)
│   ├── AttendanceManagement.Api/         # Cổng API khởi chạy chính
│   ├── AttendanceManagement.Application/ # Logic nghiệp vụ, CQRS (Features/Queries/Commands)
│   ├── AttendanceManagement.Domain/      # Các thực thể cơ sở (Entities, Enums)
│   ├── AttendanceManagement.Infrastructure/# Kết nối Database, Seed Dữ liệu mẫu, Services
│   └── AttendanceManagement.Tests/       # Unit Tests kiểm thử hệ thống
├── frontend/                             # Mã nguồn dự án Frontend (Next.js)
│   └── qldd-web/                         # Giao diện người dùng
│       ├── src/app/                      # Các trang (events, locations, devices, logs, results)
│       ├── src/components/               # Component dùng chung (Sidebar, Layout)
│       └── src/lib/                      # API Clients, Auth Context
└── docs/                                 # Tài liệu kỹ thuật chi tiết (.md)
```

---

## 🚀 Hướng dẫn khởi chạy hệ thống

### Bước 1: Cấu hình Cơ sở dữ liệu (Backend)
1. Cấu hình chuỗi kết nối SQL Server trong tệp `backend/AttendanceManagement.Api/appsettings.Development.json`.
2. Mở terminal tại thư mục `backend/` và khởi chạy API:
   ```bash
   cd backend/AttendanceManagement.Api
   dotnet run
   ```
   *Lưu ý: Swagger UI (Tài liệu API) có thể truy cập tại `https://localhost:7119/swagger`.*

### Bước 2: Khởi chạy Giao diện (Frontend)
1. Mở một cửa sổ terminal mới tại thư mục `frontend/qldd-web`.
2. Cài đặt các gói phụ thuộc (nếu chạy lần đầu):
   ```bash
   npm install
   ```
3. Khởi động môi trường phát triển Next.js:
   ```bash
   npm run dev
   ```
4. Truy cập giao diện tại địa chỉ: `http://localhost:3000`

---

## 🔑 Tài khoản & Phân quyền Thử nghiệm

Hệ thống cung cấp sẵn các tài khoản mẫu sau để trải nghiệm:

| Tên đăng nhập | Mật khẩu | Vai trò | Phạm vi quản lý |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **Quản trị hệ thống** | GLOBAL (Toàn quyền, cấu hình hệ thống) |
| **`manager`** | `admin123` | **Quản lý sự kiện** | EVENTS (Tạo, sửa, xóa sự kiện, theo dõi logs) |

---
*Phát triển bởi đội ngũ quản lý hệ thống Bệnh viện TWQĐ 108.*
