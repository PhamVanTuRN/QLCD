# DEPLOYMENT AND CONFIGURATION

Tài liệu cấu hình và triển khai hệ thống.

## 1. Backend (API)
- Nền tảng: .NET 8.0
- Web Server: Kestrel / IIS / Docker (Linux).
- **ConnectionString:** Thay đổi trong `appsettings.Production.json` (Không đẩy mật khẩu lên GitHub).
- **Database:** Microsoft SQL Server. Cần chạy tính năng EF Core Migrations khi deploy bản mới:
  `dotnet ef database update`
- Lắng nghe cổng: 5000 (HTTP) hoặc 5001 (HTTPS).

## 2. Frontend (Web UI)
- Nền tảng: Next.js (React), Node.js.
- Chạy qua PM2 hoặc Docker.
- Biến môi trường `.env.production`:
  `NEXT_PUBLIC_API_URL=https://api.diemdanh.bv108.vn`

## 3. Cấu hình Logging
- Backend sử dụng Serilog hoặc NLog.
- Phải chia file log theo ngày: `logs/attendance-api-2026-08-11.txt`.
- Chỉ lưu Information và Error. Không log Payload chứa dữ liệu nhạy cảm trừ khi ở môi trường Debug.

## 4. Bảo mật
- Tất cả API phải đi qua HTTPS.
- Endpoint nhận Log từ Device có thể cấu hình IP Allowlist (chỉ nhận từ IP của Camera AI hoặc Gateway nội bộ) hoặc yêu cầu API Key.
