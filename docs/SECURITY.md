# Chính sách vận hành xác thực

- TOTP là bắt buộc cho mọi tài khoản. Khi chưa đăng ký Authenticator, người dùng cần mã kích hoạt được giao qua kênh đã xác minh. Khi được cấp lại mật khẩu, người dùng vẫn dùng Authenticator hiện tại nếu đã liên kết. Phiên giới hạn không có vai trò nghiệp vụ.
- Khóa TOTP được mã hóa bằng Data Protection. SQL lưu SHA-256 của mã kích hoạt và bộ 10 mã khôi phục ngẫu nhiên 128 bit. API chỉ trả mã thô ở thời điểm cấp. Giữ payload và response xác thực ngoài log, lưu audit theo actor, đối tượng, thao tác và trace.
- Giữ HTTPS, cookie Secure ngoài local, CSRF, `Cache-Control: no-store`, key ring được bảo vệ và đồng bộ thời gian. Triển khai với key ring dùng chung cho các replica. Kiểm tra hạn mức theo tài khoản và IP ở ingress khi có nhiều replica. Hạn mức ứng dụng hiện lưu theo tiến trình.
- TOTP giảm rủi ro khi mật khẩu bị lộ và người dùng vẫn cần xác minh nguồn trang trước khi nhập mã. Đây là cơ chế OTP theo thời gian. [Hướng dẫn NIST về Authenticator](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/)

## Nâng schema và phát hành

`RequireAuthenticatorActivation` thêm `TaiKhoans.ActivationCodeHash` và `TaiKhoans.RecoveryCodeHashes`. Hai cột cho phép null và giữ nguyên mật khẩu, khóa TOTP, lần dùng gần nhất và bản ghi tài khoản hiện có. Phiên được cấp theo chính sách trước sẽ yêu cầu đăng nhập lại khi artifact mới phục vụ.

`SeparateActivationExpiry` thêm `TaiKhoans.ActivationCodeExpiresUtc` cho phép null. Với tài khoản đã có mã kích hoạt, migration sao chép thời hạn cũ từ `TemporaryPasswordExpiresUtc`. Hash mật khẩu, khóa Authenticator và trạng thái tài khoản được giữ nguyên. Deployment cần sao lưu trước khi áp dụng. Hạ riêng migration này làm mất thời hạn kích hoạt độc lập. Ưu tiên sửa tiến hoặc phục hồi bản sao đã đối soát.

1. Chuẩn bị kênh giao mã và quyền cấp mã. Sao lưu và thử phục hồi SQL cùng key ring trên bản sao. Xác nhận cửa sổ triển khai trước khi áp dụng vào cơ sở dữ liệu đang hoạt động.
2. Áp migration bằng artifact backend với `--migrate` và kết nối DDL. Với quản trị viên đang hoạt động chưa có Authenticator, xác minh danh tính rồi dùng `--issue-mfa-enrollment` cùng `Bootstrap__Username` và `Bootstrap__ActivationCode`. Lệnh này giữ mật khẩu hiện tại.
3. Đặt `Security__CredentialResetAccountId` trên mọi replica bằng ID của `qlcd_admin`. Khi dùng tài khoản hiện có, lấy ID với `SELECT Id FROM dbo.TaiKhoans WHERE Username = N'qlcd_admin' AND VaiTro = N'ADMIN' AND IsDeleted = 0;`. Khi khởi tạo mới, tạo một GUID và dùng cùng giá trị đó cho `--bootstrap-admin` với `Bootstrap__Username=qlcd_admin` và runtime API. Backend yêu cầu khớp ID, tài khoản và vai trò. Bỏ trống cấu hình sẽ vô hiệu hóa cả hai thao tác.
4. Phát hành frontend và API cùng phiên bản. Các client đang gọi `/api/v1/accounts/{id}/reset-authentication` cần chuyển sang `/reset-password` và `/reset-2fa` theo từng thao tác. Kiểm tra readiness, đăng nhập quản trị viên, cấp mã cho các tài khoản cũ cần thiết lập và thử các bước trên thiết bị thật. Cấp quyền runtime theo hướng dẫn vận hành.

Ưu tiên bản vá tương thích tiến nếu phát hành gặp lỗi. Hạ migration xóa cả hai cột băm và làm mất mã đã phát hành. Phục hồi bản sao chỉ sau khi đã đối soát dữ liệu phát sinh và khóa Data Protection. [Runbook bảo mật](security-audit/08-remediation-status.md)
