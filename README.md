# QLCD - Hệ thống Quản lý Đoàn viên Công đoàn

Hệ thống quản lý, tra cứu hồ sơ và biến động đoàn viên công đoàn trực tuyến thời gian thực, thiết kế riêng cho tổ chức công đoàn cơ sở liên cấp.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### 1. Backend API
- **Core:** .NET 8 (ASP.NET Core Web API)
- **Database Access:** Entity Framework Core (EF Core)
- **DBMS:** SQL Server
- **Architecture Pattern:** CQRS (Command Query Responsibility Segregation) sử dụng thư viện **MediatR**
- **Security:** JWT Authentication & Role-Based Authorization

### 2. Frontend Web App
- **Core Framework:** Next.js (React)
- **Styling:** TailwindCSS & Vanilla CSS
- **Icons:** Lucide Icons
- **Biểu đồ:** Recharts

---

## 🌟 Tính năng chính

1. **Dashboard Chỉ đạo & Thống kê Tổng quan:**
   - Biểu đồ biến động đoàn viên theo Tổ chức Công đoàn (tự động co giãn 100% card trên màn hình rộng, kích hoạt thanh cuộn ngang khi số lượng đơn vị vượt quá khung nhìn).
   - Biểu đồ cơ cấu theo Khối chuyên môn, Biến động Thu - Chi tài chính, Hoạt động tháng và kết quả thi đua khen thưởng.
   - Thống kê chi tiết cơ cấu đoàn viên theo: Loại cán bộ, Học vấn, Đảng viên, Ngoại ngữ, Dân tộc, Tôn giáo, Thi đua, Chức vụ.
2. **Quản lý Hồ sơ Đoàn viên:**
   - Tra cứu nhanh theo Họ tên, Mã nhân viên, Số CCCD.
   - Lọc nâng cao theo Đơn vị, Vai trò công đoàn và Trạng thái sinh hoạt.
   - Quản lý đầy đủ thông tin: CCCD, Học hàm/Học vị, Quê quán, Địa chỉ liên hệ, Số thẻ đoàn viên, Chứng chỉ ngoại ngữ.
3. **Điều động & Chuyển sinh hoạt:**
   - Thực hiện chuyển sinh hoạt đoàn viên sang đơn vị mới.
   - Tải lên quyết định điều động/minh chứng định dạng PDF.

---

## 📁 Cấu trúc thư mục

```text
QLCD/
├── backend/                  # Mã nguồn dự án Backend (.NET 8)
│   ├── QLCD.Api/             # Cổng API khởi chạy chính
│   ├── QLCD.Application/     # Logic nghiệp vụ, CQRS (Features/Queries/Commands)
│   ├── QLCD.Domain/          # Các thực thể cơ sở (Entities, Enums)
│   ├── QLCD.Infrastructure/  # Kết nối Database, Seed Dữ liệu mẫu, Services
│   └── QLCD.Tests/           # Unit Tests kiểm thử hệ thống
└── frontend/                 # Mã nguồn dự án Frontend (Next.js)
    └── qlcd-web/             # Giao diện người dùng
        ├── src/app/          # Các trang (Dashboard, Members, Detail)
        ├── src/components/   # Component dùng chung
        └── src/lib/          # API Clients, Auth Context, Types
```

---

## 🚀 Hướng dẫn khởi chạy hệ thống

### Bước 1: Cấu hình Cơ sở dữ liệu (Backend)
1. Cấu hình chuỗi kết nối SQL Server trong tệp `backend/QLCD.Api/appsettings.Development.json` (hoặc `appsettings.Local.json`):
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=localhost,1433;Database=qlcd;User Id=sa;Password=SqlServer@2026Dev!;MultipleActiveResultSets=True;TrustServerCertificate=True;"
   }
   ```
2. Mở terminal tại thư mục `backend/` và khởi chạy API:
   ```bash
   cd backend/QLCD.Api
   dotnet run
   ```
   *Lưu ý: Hệ thống sẽ tự động chạy Migrations để tạo bảng và tự động nạp (Seed) dữ liệu mẫu bao gồm danh mục, tổ chức và tài khoản hệ thống.*

### Bước 2: Khởi chạy Giao diện (Frontend)
1. Mở một cửa sổ terminal mới tại thư mục `frontend/qlcd-web`.
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

Hệ thống cung cấp sẵn các tài khoản mẫu đại diện cho từng cấp phân quyền quản trị công đoàn:

| Tên đăng nhập | Mật khẩu | Vai trò | Phạm vi quản lý |
| :--- | :--- | :--- | :--- |
| **`admin`** | `admin123` | **ADMIN** | Toàn bộ hệ thống (Toàn quyền) |
| **`cdcs_benhvien`** | `admin123` | **CDCS** | Công đoàn cơ sở Bệnh viện |
| **`cdbp_khoi_noi_1`** | `admin123` | **CDBP** | Khối Nội 1 (Đơn vị con cấp 2) |
| **`cdbp_khoi_ngoai_ct`** | `admin123` | **CDBP** | Khối Ngoại Chấn thương (Đơn vị con cấp 2) |
| **`tocd_tieu_hoa`** | `admin123` | **TOCD** | Tổ CĐ Khoa Tiêu hóa (Đơn vị con cấp 3) |



# 1. Kiểm tra các tệp tin đã thay đổi
git status

# 2. Thêm toàn bộ thay đổi vào hàng đợi commit
git add .

# 3. Commit thay đổi với mô tả chi tiết
git commit -m "docs: add README.md, fix organization stats chart and members list pagination"

# 4. Đẩy mã nguồn lên nhánh chính của bạn (ví dụ main hoặc master)
git push origin main


---
*Phát triển bởi đội ngũ quản lý hệ thống QLCD.*
