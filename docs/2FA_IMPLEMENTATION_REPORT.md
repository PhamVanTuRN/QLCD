# Báo cáo hoàn thiện xác thực hai bước

## Hiện trạng và xử lý

| Hiện trạng đã rà soát | Thay đổi đã triển khai |
| --- | --- |
| Người dùng có thể dùng nghiệp vụ khi chưa liên kết Authenticator. Một số vai trò có thể tự tắt. | Backend chỉ cấp vai trò nghiệp vụ sau khi có Authenticator và hoàn tất đổi mật khẩu bắt buộc. Bỏ thao tác tự tắt và thu hồi phiên theo chính sách cũ. |
| Tài khoản mới cần quản trị viên đặt mật khẩu tạm riêng, thiếu mã xác minh người nhận trước khi đăng ký QR. | Băm mật khẩu khởi tạo với salt riêng. Quản trị viên xác minh danh tính và giao mã kích hoạt dùng một lần, có hạn 24 giờ. Chỉ cấp QR sau khi kiểm cả hai giá trị. |
| Đổi mật khẩu chỉ kiểm mật khẩu hiện tại. | Kiểm xác nhận, chính sách và OTP mới. Bảo toàn cấu hình Authenticator, thu hồi phiên cũ và ghi audit. |
| Khôi phục Authenticator phụ thuộc quy trình vận hành thủ công. | Cấp một lần bộ 10 mã ngẫu nhiên, lưu hash. Mã chỉ cho phép thiết lập thiết bị thay thế, sau đó xác thực lại bằng OTP. Quản trị viên hỗ trợ qua đối chiếu danh tính, nhập lại mật khẩu và OTP. |
| Màn hình thiếu quy trình cho tài khoản đang thiết lập, mất thiết bị và quên mật khẩu. | Bổ sung kích hoạt, QR, lưu mã, nhập hoặc dán OTP, xác nhận mật khẩu mới, hướng dẫn khôi phục và trạng thái Authenticator trong trang quản trị. |

## Tệp thay đổi

- Backend API và phiên gồm `AuthController.cs`, `AuthenticatorController.cs`, `AccountsController.cs`, `AuthenticatorTickets.cs`, `LoginThrottle.cs`, `SessionAuthenticationHandler.cs`, `TotpVerifier.cs`, `SecurityMaintenance.cs` và `Program.cs`.
- Nghiệp vụ gồm `AccountCredentials.cs`, `LoginCommand.cs`, `AccountCommands.cs`, `GetAccountsQuery.cs`, `CreateUnionUnitCommand.cs` và `SecurityRoles.cs`.
- SQL gồm thực thể `TaiKhoan.cs`, `QLCDDbContext.cs`, migration `RequireAuthenticatorActivation` cùng designer và snapshot model.
- Giao diện gồm `login/page.tsx`, `account-security/page.tsx`, `accounts/page.tsx`, `AuthenticatorFields.tsx`, `AppShell.tsx`, `auth-context.tsx` và `api.ts`.
- Kiểm thử gồm `SecurityTests.cs`, `test-security-smoke.mjs`, `test-sql.ps1`, `browser.mjs` và `totp-fixture.mjs`.
- Vận hành và hướng dẫn gồm `.env.example`, `README.md`, `AGENTS.md`, skill `qlcd-security-review`, tài liệu nghiệp vụ và các hướng dẫn liên kết dưới đây.

## Migration và sơ đồ

Migration thêm hai cột nullable vào `TaiKhoans` để lưu hash, giữ nguyên mật khẩu và dữ liệu TOTP hiện có. Tài khoản cũ chưa có TOTP cần được cấp mã thiết lập bằng mật khẩu đang dùng. Bản thử trên cổng `3004` dùng SQL Server Express với `QLCD_MFA_Demo`. Bản `QLCD_Local` trên cổng `3003` tiếp tục phục vụ schema cũ cho đến khi cửa sổ nâng cấp được xác nhận. [Nâng schema, cấu hình và phục hồi](SECURITY.md)

- [Sơ đồ đăng nhập và đổi mật khẩu](AUTHENTICATION.md)
- [Sơ đồ kích hoạt và thiết lập Authenticator](TWO_FACTOR_AUTHENTICATION.md)
- [Sơ đồ khôi phục tài khoản](ACCOUNT_RECOVERY.md)
- [Lệnh kiểm thử và bằng chứng](TESTING.md)

## Kết quả đã kiểm chứng

| Hạng mục | Kết quả |
| --- | --- |
| Backend Release, frontend production, lint và typecheck | Qua |
| xUnit | 15 ca mặc định qua. 6 ca trên SQL Express qua, gồm ca giao dịch đồng thời chạy riêng. |
| HTTP smoke | Qua trên InMemory và SQL Express riêng. Chặn API nghiệp vụ trước khi hoàn tất 2FA. Xác nhận OTP sai, hết hạn, đã dùng và thử quá hạn mức. Hai yêu cầu cùng OTP chỉ có một thành công. |
| Khôi phục SQL | Chạy migration trên schema trống và schema cũ có dữ liệu mẫu, chạy lại idempotent và kiểm tra tính toàn vẹn sau restore. |
| Playwright | 20 luồng và 98 ảnh ở 7 chiều rộng. Không tràn ngang, lỗi trình duyệt, lỗi API ngoài dự kiến hoặc phát hiện axe trên các trang đã quét. |

## Điều kiện nghiệm thu trên môi trường đích

Xác minh kênh bàn giao mã của đơn vị, quy trình vận hành để cứu tài khoản quản trị, HTTPS, đồng bộ giờ máy chủ, key ring và backup. Với nhiều replica, dùng ingress áp hạn mức chia sẻ. Thử quét QR bằng điện thoại thật. Các bước phục hồi SQL trong bài kiểm thử dùng dữ liệu tổng hợp. [Theo dõi kết quả](TASK_TRACKER.md)
