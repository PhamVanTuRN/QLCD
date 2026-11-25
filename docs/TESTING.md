# Kiểm thử xác thực QLCD

| Kiểm tra | Lệnh hoặc minh chứng |
| --- | --- |
| Băm mật khẩu, bảo toàn mật khẩu cũ và xoay mã | `dotnet test backend/QLCD.sln` |
| Kích hoạt, giới hạn phiên, OTP, thu hồi phiên, khôi phục và quản trị | `node tools/test-security-smoke.mjs` sau khi build backend |
| Các thao tác tương tự trên SQL Express cô lập | `node tools/test-security-smoke.mjs --sql-local` |
| Schema mới, nâng dữ liệu cũ, chạy lại và phục hồi | `./tools/test-sql.ps1 -RehearseRestore` |
| Lint và production build | `npm run lint -- --max-warnings 0`, `npm run build`, `npm run typecheck` trong `frontend/qlcd-web` |
| Kích hoạt bằng màn hình quản trị, quét QR bằng fixture, đổi mật khẩu, khôi phục thiết bị | `npm run test:browser` trong `frontend/qlcd-web` |

Dùng tài khoản và mã tổng hợp trong cơ sở dữ liệu riêng. QR trong kiểm thử trình duyệt được xác minh bằng mã TOTP sinh từ khóa thử nghiệm. Nghiệm thu trên thiết bị thật gồm quét bằng Google Authenticator và Microsoft Authenticator, dán mã trên điện thoại, thay thiết bị và khôi phục với key ring của môi trường thực tế. [Bằng chứng đã chạy](TASK_TRACKER.md)
