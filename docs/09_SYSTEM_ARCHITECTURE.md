# 09. SYSTEM ARCHITECTURE - KIẾN TRÚC HỆ THỐNG

Dự án QLCD áp dụng kiến trúc phần mềm Clean Architecture kết hợp mô hình phân lớp tách biệt giữa Backend (.NET 8) và Frontend (Next.js 14+ App Router).

## 1. Mô hình Kiến trúc Vật lý (Deployment Architecture)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Client      │       │     Backend     │       │    Database     │
│   (Next.js)     │ ────> │  (.NET 8 API)   │ ────> │ (Postgres/SQL)  │
│ Browser/Mobile  │       │   Application   │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

## 2. Kiến trúc Backend: Clean Architecture
Phần mềm Backend được chia thành 5 dự án (Projects) để cô lập logic nghiệp vụ độc lập với các công nghệ bên ngoài:

```
                  ┌─────────────────────────────┐
                  │          QLCD.Api           │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │      QLCD.Application       │
                  └──────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │         QLCD.Domain         │
                  └─────────────────────────────┘
                                 ▲
                  ┌──────────────│──────────────┐
                  │     QLCD.Infrastructure      │
                  └─────────────────────────────┘
```

* **QLCD.Domain (Enterprise Domain Logic)**:
  * Chứa các Entity cốt lõi (DoanVien, DonViCongDoan, DongDoanPhi...), Value Objects, Domain Exceptions và Interfaces cho các Repository.
  * Không tham chiếu đến bất kỳ thư viện ngoài nào (trừ thư viện hệ thống cơ bản).
* **QLCD.Application (Application Business Rules)**:
  * Chứa các DTOs (Data Transfer Objects), CQRS Handlers (sử dụng MediatR), Validators (sử dụng FluentValidation) và AutoMapper Profiles.
  * Phụ thuộc trực tiếp vào `QLCD.Domain`.
* **QLCD.Infrastructure (External Technologies)**:
  * Chứa các cài đặt thực tế của các Repository Interface (sử dụng Entity Framework Core), các dịch vụ tương tác hệ thống bên ngoài (Email, OTP, Storage Service, Database Migrations).
  * Phụ thuộc vào `QLCD.Domain` và `QLCD.Application`.
* **QLCD.Api (Presentation)**:
  * Chứa các Controllers định nghĩa các điểm cuối RESTful, Middlewares (xử lý Exception, Authentication/Authorization với JWT), Swagger Configuration.
  * Phụ thuộc vào `QLCD.Application` và `QLCD.Infrastructure` để khởi động DI (Dependency Injection) container.
* **QLCD.Shared**:
  * Chứa các class tiện ích, hằng số dùng chung, các cấu hình chung cho toàn bộ solution.

## 3. Kiến trúc Frontend: Next.js App Router
Ứng dụng frontend được tổ chức theo cấu trúc thư mục tiêu chuẩn của Next.js 14+ sử dụng `src` directory và Tailwind CSS để dựng giao diện:

```
qlcd-web/
├── src/
│   ├── app/                # App Router (pages & layouts)
│   │   ├── (auth)/         # Nhóm route yêu cầu đăng nhập
│   │   │   ├── doan-vien/  # Quản lý đoàn viên
│   │   │   ├── tai-chinh/  # Quản lý đóng đoàn phí
│   │   │   └── thi-dua/    # Quản lý thi đua
│   │   ├── login/          # Trang đăng nhập
│   │   └── page.tsx        # Dashboard chính
│   ├── components/         # UI Components dùng chung (Button, Table, Modal...)
│   ├── hooks/              # Custom React Hooks
│   ├── services/           # API Services (Axios wrapper calls)
│   └── utils/              # Helper functions, format tiền tệ, ngày tháng
```

## 4. Cơ chế Xác thực & Phân quyền (Authentication & Authorization)
* **Xác thực**: Sử dụng cơ chế token JWT (JSON Web Token) ngắn hạn (15 phút) kết hợp với Refresh Token dài hạn (7 ngày) lưu trữ trong HttpOnly Cookie để đảm bảo tính an toàn.
* **Phân quyền**: Áp dụng Permission-based Authorization. Cụ thể, mỗi vai trò sẽ sở hữu một danh sách các chuỗi Permission (ví dụ: `DoanVien.Create`, `TaiChinh.Approve`). Khi API nhận request, middleware sẽ giải mã JWT và đối chiếu quyền của user với quyền yêu cầu của endpoint.
