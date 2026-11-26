# Kiểm thử và hồi quy QLCD

| Kiểm tra | Lệnh hoặc minh chứng |
| --- | --- |
| Backend, mật khẩu và hồi quy nghiệp vụ | `dotnet build backend/QLCD.sln` và `dotnet test backend/QLCD.sln` |
| Phân quyền, kích hoạt, giới hạn phiên, OTP, thu hồi phiên, khôi phục và quản trị | `node tools/test-security-smoke.mjs` sau khi build backend |
| Các thao tác tương tự trên SQL Express cô lập | `node tools/test-security-smoke.mjs --sql-local` |
| Schema mới, nâng dữ liệu cũ, chạy lại và phục hồi | `./tools/test-sql.ps1 -RehearseRestore` |
| Lint và production build | `npm run lint -- --max-warnings 0`, `npm run build`, `npm run typecheck` trong `frontend/qlcd-web` |
| Kích hoạt, tiếp tục QR sau tải lại, đổi mật khẩu, khôi phục, quản trị tài khoản và cây | `npm run test:browser` trong `frontend/qlcd-web` |
| Locked restore, quét secret, SAST, advisory và SBOM | [Workflow bảo mật](../.github/workflows/security.yml) và [cổng phát hành](security-audit/07-security-checklist.md#cổng-kiểm-tra-cho-lần-sửa-hoặc-phát-hành) |

## Fixture và cấu hình local

Dùng dữ liệu tổng hợp, cơ sở dữ liệu riêng và storage thử trên loopback. Để chạy riêng `LoginLockoutTests` hoặc `AuthenticatedUnlockTests` trên SQL Server, cung cấp `QLCD_TEST_LOGIN_SQL_CONNECTION` hoặc `QLCD_TEST_UNLOCK_SQL_CONNECTION` tương ứng, trỏ tới fixture đã chuẩn bị. Các kiểm thử SQL của `ReportQueriesTests` dùng `QLCD_TEST_SQL_CONNECTION`, được `tools/test-sql.ps1` thiết lập cho lượt chạy của script. Với DLL API build ra thư mục riêng, đặt `QLCD_TEST_API_DLL` cho HTTP và browser smoke. Dùng `QLCD_BROWSER_ARTIFACTS` để chọn thư mục ảnh và báo cáo trình duyệt.

## Ca hồi quy cần giữ

- Kiểm tra mã kích hoạt dùng một lần, phiên giới hạn, OTP chống tái sử dụng, tự mở tổng quan sau thiết lập khi được phép và đổi mật khẩu bắt buộc sau reset quản trị. Kiểm tra lỗi thứ năm khóa 10 phút, `Retry-After`, bộ đếm còn hiệu lực sau khi khởi động lại API và chỉ xóa sau khi hoàn tất xác thực hoặc hết khóa.
- Kiểm form đăng nhập mặc định không hiện hoặc gửi mã kích hoạt. Mở bước thiết lập thì đi tới QR; đóng bước này xóa mã đã nhập. Sau khi liên kết, đăng nhập bằng mật khẩu và OTP từ form mặc định.
- Kiểm tra người có ID được cấu hình vẫn thực hiện được cả hai reset sau khi đổi username. Từ chối ADMIN khác, tự reset, OTP sai hoặc đã dùng. Xác nhận Reset mật khẩu giữ Authenticator, Reset 2FA giữ mật khẩu, cả hai thu hồi phiên đích và ghi audit. Kiểm tra hủy hộp thoại, cấp mã, khóa và mở khóa hiện có.
- Trên SQL, thử khôi phục chính đơn vị liên kết khi mở khóa, lỗi giữa transaction và cha ngừng. Dùng hai context để xác nhận cập nhật cũ bị từ chối sau khi đơn vị, trạng thái duyệt hoặc xóa mềm thay đổi. Kiểm tra sự kiện đọc hồ sơ và tải minh chứng chỉ được ghi cho truy cập hợp lệ.

QR trong kiểm thử trình duyệt dùng TOTP sinh từ khóa thử nghiệm. Nghiệm thu trên thiết bị thật gồm quét bằng Google Authenticator và Microsoft Authenticator, dán mã trên điện thoại, thay thiết bị và khôi phục với key ring của môi trường đích. [Bằng chứng đã chạy](TASK_TRACKER.md)
