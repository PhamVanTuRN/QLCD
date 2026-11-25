# Công đoàn số 108

QLCD quản lý cơ cấu công đoàn, hồ sơ đoàn viên, hoạt động, đoàn phí, phúc lợi, sáng kiến và thi đua cho Bệnh viện Trung ương Quân đội 108. Next.js phục vụ giao diện tiếng Việt. ASP.NET Core xử lý API và phân quyền. EF Core lưu nghiệp vụ trên SQL Server.

## Khởi chạy local

Yêu cầu .NET SDK 10 và Node.js 20.9 trở lên. CI dùng Node.js 24. Chạy hai terminal từ thư mục gốc. Phiên local dưới đây dùng cơ sở dữ liệu InMemory và tài khoản quản trị tạm.

~~~powershell
dotnet restore backend/QLCD.sln --locked-mode
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DOTNET_ENVIRONMENT = 'Development'
$env:Data__UseInMemory = 'true'
$env:Bootstrap__OnDevelopmentStart = 'true'
$env:Bootstrap__Username = 'qlcd-local'
$env:Bootstrap__ActivationCode = [System.Net.NetworkCredential]::new('', (Read-Host 'Mã kích hoạt riêng 32 ký tự hex' -AsSecureString)).Password
dotnet run --project backend/QLCD.Api --no-launch-profile -- --urls http://127.0.0.1:5023
~~~

~~~powershell
Set-Location frontend/qlcd-web
npm ci --no-audit --no-fund
npm run dev
~~~

Mở `http://localhost:3000`, đăng nhập bằng mật khẩu khởi tạo và mã kích hoạt riêng. Quét QR, nhập OTP, lưu mã khôi phục và đổi mật khẩu. Sau đó tạo CĐCS, CĐBP hoặc tổ công đoàn. Trong **Tài khoản**, xác minh người nhận và cấp mã kích hoạt cho tài khoản mới. Dữ liệu InMemory mất khi dừng API. [Thiết lập Authenticator](docs/TWO_FACTOR_AUTHENTICATION.md) · [Khôi phục tài khoản](docs/ACCOUNT_RECOVERY.md)

### Chạy local với SQL Server Express

Trên Windows, có thể dùng xác thực Windows để lưu dữ liệu vào cơ sở dữ liệu riêng `QLCD_Local`. Đặt các biến sau trong terminal chạy backend. Bật `TrustServerCertificate` chỉ khi SQL Express dùng chứng thư tự ký trên kết nối bộ nhớ chia sẻ nội bộ. API yêu cầu kiểm tra chứng thư trên các kết nối SQL từ xa và môi trường triển khai. [Mã hóa kết nối SQL Server](https://learn.microsoft.com/en-us/sql/connect/ado-net/encryption-and-certificate-validation)

~~~powershell
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DOTNET_ENVIRONMENT = 'Development'
$env:Data__UseInMemory = 'false'
$env:Bootstrap__OnDevelopmentStart = 'false'
$env:ConnectionStrings__DefaultConnection = 'Server=lpc:.\SQLEXPRESS;Database=QLCD_Local;Integrated Security=True;Encrypt=True;TrustServerCertificate=True'
$env:ConnectionStrings__Migration = $env:ConnectionStrings__DefaultConnection
~~~

Khi tạo cơ sở dữ liệu lần đầu, chạy backend với `--migrate`, sau đó `--initialize-data`. Dùng `--bootstrap-admin` cùng `Bootstrap__Username` và `Bootstrap__ActivationCode` để tạo tài khoản quản trị đầu tiên rồi bỏ hai biến này trước khi chạy ứng dụng. Với quản trị viên cũ chưa thiết lập Authenticator, dùng `--issue-mfa-enrollment` để cấp mã và giữ mật khẩu hiện tại. [Nâng schema và phát hành](docs/SECURITY.md)

## Xác minh thay đổi

Từ thư mục gốc, chạy `dotnet build backend/QLCD.sln`, `dotnet test backend/QLCD.sln` và `node tools/test-security-smoke.mjs`. Tập lệnh HTTP sử dụng API Debug trên loopback với dữ liệu tổng hợp. Trên Windows, `./tools/test-sql.ps1` kiểm tra các migration và truy vấn báo cáo bằng SQL Express local, Windows Authentication, `sqlcmd` và EF CLI 10.

Thêm `-RehearseRestore` để diễn tập sao lưu và phục hồi SQL bằng database tổng hợp. Script cần quyền tạo database local và quyền tạo thư mục tạm dưới `%ProgramData%` để cấp quyền cho dịch vụ SQL ghi bản sao. [Hướng dẫn diễn tập](docs/security-audit/08-remediation-status.md#vận-hành-và-khôi-phục)

Dùng `node tools/test-security-smoke.mjs --sql-local` để chạy cùng bộ kiểm thử HTTP với một database SQL Express tổng hợp trên Windows. Database này được tạo và dọn riêng cho mỗi lượt chạy.

Trong `frontend/qlcd-web`, chạy `npm run lint -- --max-warnings 0`, `npm run build` và `npm run typecheck`. Sau khi build cả API Debug và frontend, chạy `npm run test:browser`. Trình duyệt được chọn bằng `QLCD_CHROMIUM_PATH`, Chrome đã cài trên Windows hoặc Chromium do Playwright cài bằng `npx playwright-core install chromium`. Ảnh và JSON được lưu trong `artifacts/browser`. [Kịch bản kiểm thử](frontend/qlcd-web/tests/browser.mjs)

## Tài liệu

- [Tổng quan kiến trúc và quyền hiện hành](docs/PROJECT_OVERVIEW.md)
- [Rà soát và kế hoạch xử lý](docs/PROJECT_AUDIT.md)
- [Thiết kế giao diện](docs/DESIGN_SYSTEM.md)
- [Kiểm toán bảo mật và triển khai](docs/security-audit/README.md)
- [Báo cáo hoàn thiện xác thực hai bước](docs/2FA_IMPLEMENTATION_REPORT.md)
- [Theo dõi công việc](docs/TASK_TRACKER.md)
- [Báo cáo tổng kết](docs/FINAL_REPORT.md)
- [Hướng dẫn phát triển và kỹ năng agent](AGENTS.md)
