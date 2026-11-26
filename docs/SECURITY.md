# Chính sách vận hành xác thực

- TOTP là bắt buộc cho mọi tài khoản. Khi chưa đăng ký Authenticator, người dùng cần mã kích hoạt được giao qua kênh đã xác minh. Khi được cấp lại mật khẩu, người dùng vẫn dùng Authenticator hiện tại nếu đã liên kết. Phiên giới hạn không có vai trò nghiệp vụ.
- Khóa TOTP được mã hóa bằng Data Protection. SQL lưu SHA-256 của mã kích hoạt và bộ 10 mã khôi phục ngẫu nhiên 128 bit. API chỉ trả mã thô ở thời điểm cấp. Giữ payload và response xác thực ngoài log, lưu audit theo actor, đối tượng, thao tác và trace.
- Giữ HTTPS, cookie Secure ngoài local, CSRF, `Cache-Control: no-store`, key ring được bảo vệ và đồng bộ thời gian. Dùng key ring chung cho các replica. Khóa đăng nhập theo tài khoản lưu trong SQL. Hạn mức theo IP và nhóm xác thực lại nhạy cảm của API lưu theo tiến trình. Kiểm tra hạn mức tại ingress khi có nhiều replica.
- TOTP giảm rủi ro khi mật khẩu bị lộ và người dùng vẫn cần xác minh nguồn trang trước khi nhập mã. Đây là cơ chế OTP theo thời gian. [Hướng dẫn NIST về Authenticator](https://pages.nist.gov/800-63-4/sp800-63b/authenticators/)

## Nâng schema và phát hành

`RequireAuthenticatorActivation` thêm `TaiKhoans.ActivationCodeHash` và `TaiKhoans.RecoveryCodeHashes`. Hai cột cho phép null và giữ nguyên mật khẩu, khóa TOTP, lần dùng gần nhất và bản ghi tài khoản hiện có. Phiên được cấp theo chính sách trước sẽ yêu cầu đăng nhập lại khi artifact mới phục vụ.

`SeparateActivationExpiry` thêm `TaiKhoans.ActivationCodeExpiresUtc` cho phép null. Với tài khoản đã có mã kích hoạt, migration sao chép thời hạn cũ từ `TemporaryPasswordExpiresUtc`. Hash mật khẩu, khóa Authenticator và trạng thái tài khoản được giữ nguyên. Deployment cần sao lưu trước khi áp dụng. Hạ riêng migration này làm mất thời hạn kích hoạt độc lập. Ưu tiên sửa tiến hoặc phục hồi bản sao đã đối soát.

1. Chuẩn bị kênh giao mã và quyền cấp mã. Sao lưu và thử phục hồi SQL cùng key ring trên bản sao. Xác nhận cửa sổ triển khai trước khi áp dụng vào cơ sở dữ liệu đang hoạt động.
2. Áp migration bằng artifact backend với `--migrate` và kết nối DDL. Với quản trị viên đang hoạt động chưa có Authenticator, xác minh danh tính rồi dùng `--issue-mfa-enrollment` cùng `Bootstrap__Username` và `Bootstrap__ActivationCode`. Lệnh này giữ mật khẩu hiện tại.
3. Đặt `Security__CredentialResetAccountId` trên mọi replica bằng ID đã xác minh của `qlcd_admin`. Khi tên hiện tại còn là `qlcd_admin`, đối chiếu bằng `SELECT Id FROM dbo.TaiKhoans WHERE Username = N'qlcd_admin' AND VaiTro = N'ADMIN' AND IsDeleted = 0;`. Nếu tài khoản đã đổi tên, đối chiếu ID từ hồ sơ vận hành. Khi khởi tạo mới, dùng cùng một GUID cho `--bootstrap-admin` với `Bootstrap__Username=qlcd_admin` và runtime API. Backend cấp quyền theo ID và vai trò ADMIN đang hiệu lực. Sau khi đổi tên, giữ nguyên ID đã cấu hình. Bỏ trống ID làm ẩn cả hai thao tác và API ghi cảnh báo khi khởi động. Trên máy phát triển có thể đặt `Security:CredentialResetAccountId` trong `backend/QLCD.Api/appsettings.Local.json` được Git bỏ qua, sau đó khởi động lại API.
4. Phát hành frontend và API cùng phiên bản. Các client đang gọi `/api/v1/accounts/{id}/reset-authentication` cần chuyển sang `/reset-password` và `/reset-2fa` theo từng thao tác. Kiểm tra readiness, đăng nhập quản trị viên, cấp mã cho các tài khoản cũ cần thiết lập và thử các bước trên thiết bị thật. Cấp quyền runtime theo hướng dẫn vận hành.

Ưu tiên bản vá tương thích tiến nếu phát hành gặp lỗi. Hạ migration xóa cả hai cột băm và làm mất mã đã phát hành. Phục hồi bản sao chỉ sau khi đã đối soát dữ liệu phát sinh và khóa Data Protection. [Runbook bảo mật](security-audit/08-remediation-status.md)

## Khóa đăng nhập và phiên thiết lập 2FA

Migration `20261126085830_LoginLockoutAndEnrollment` thêm bảng `LoginAttempts` và ba cột bổ sung cho tài khoản và phiên. Giá trị mặc định giữ phiên và thông tin xác thực hiện có. Chạy `--migrate` với principal DDL trước khi đưa API và frontend mới vào phục vụ. Principal runtime cần đọc và ghi `LoginAttempts` và quyền dùng `sp_getapplock` ở database ứng dụng. Nếu cần lùi bản phát hành, ưu tiên khôi phục artifact trước và giữ schema bổ sung. Hạ migration sẽ xóa bộ đếm, thời hạn khóa và trạng thái thiết lập mới.

SQL lưu trạng thái UTC theo ID tài khoản. Tên chưa nhận diện dùng khóa băm và cùng phản hồi để tránh lộ sự tồn tại của tài khoản. Chạy `--expire-sessions` định kỳ để dọn phiên hết hạn và các bộ đếm tên chưa nhận diện đã qua khóa, có lần sai cuối cách ít nhất 24 giờ. Khóa cấp transaction của SQL tuần tự hóa các lần xác thực theo khóa, kể cả qua nhiều replica. Giữ rate limit theo IP và xác minh địa chỉ nguồn tại ingress. Audit dùng `AUTH_LOGIN_FAILED` và `AUTH_LOGIN_LOCKOUT` cho tài khoản xác định được, lưu định danh và trace mà không lưu mật khẩu, OTP, khóa QR hoặc mã kích hoạt.

Migration `20261126100244_GuardScopedWrites` tiếp theo đồng bộ EF snapshot và thêm mốc lịch sử migration. `Up` và `Down` rỗng. EF dùng concurrency token để từ chối bản ghi đã đổi đơn vị, trạng thái duyệt, loại tài chính hoặc trạng thái xóa mềm sau lúc kiểm quyền. Theo lần kiểm tra ngày 26/11/2026, `QLCD_Local` có 6 migration. Áp hai migration này theo thứ tự bằng principal DDL sau khi sao lưu, diễn tập và được phê duyệt, rồi xác minh readiness trước khi đưa artifact mới vào phục vụ. [Kiểm chứng và việc còn mở](security-audit/SECURITY_AUDIT.md)

## Nâng schema Khối quản lý

Migration `20261126050655_ManagementBlockDetails` chỉ ADD `KhoiChuyenMons.GhiChu` nullable nvarchar(500) và `TrangThai` bit NOT NULL default 1. Không đổi ID, FK, tên hoặc trạng thái của đơn vị/tài khoản, không gán MaKhoi cho đơn vị cũ và không hợp nhất danh mục theo tên. FK MaKhoi vẫn nullable để giữ tương thích dữ liệu cũ; API bắt buộc chọn khi tạo mới. Chạy `--migrate` bằng connection Migration đã cấu hình trước khi phục vụ API mới, kiểm tra đúng database đích theo quy trình phê duyệt vận hành. Không chạy initialize/bootstrap để thay cho migration.

Downgrade của migration bỏ hai cột mới. Sao lưu hoặc xuất thông tin khối trước khi cân nhắc và ưu tiên bản vá tiến hoặc bản phục hồi đã được phê duyệt. Kịch bản SQL hiện hành kiểm mốc 8 migration trên cơ sở dữ liệu riêng, gồm nâng schema cũ, giữ dữ liệu có hoặc chưa có `MaKhoi` và chạy lại migration. [Kiểm thử SQL](TESTING.md)

Quản trị viên bổ sung phân loại cũ bằng Cây tổ chức → chọn đơn vị → Sửa đơn vị → Khối quản lý → chọn khối đang dùng và lưu. Đơn vị ngừng cần khôi phục riêng nếu muốn sửa từ cây chính. Không tạo lại đơn vị/tài khoản. Nếu danh mục khối tùy chỉnh trước đây chỉ nằm trong DanhMucDungChung, kiểm kê qua GET catalogs loại KhoiChuyenMon, đối chiếu thủ công với nguồn chuẩn rồi tạo khối cần thiết và chọn cho từng đơn vị; hệ thống không tự suy ra ánh xạ.
