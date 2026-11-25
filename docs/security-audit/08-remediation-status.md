# 08 · Tình trạng khắc phục bảo mật

Ngày 23/11/2026. Thay đổi giữ mô hình Next.js và ASP.NET Core phân lớp. Các ID dưới đây ứng với snapshot trước khi sửa. Bản production cần đi qua cửa sổ chuyển đổi credential và nghiệm thu cùng hạ tầng thật.

| ID | Kiểm soát đã triển khai trong repository | Điều kiện áp dụng hoặc xác minh |
| --- | --- | --- |
| SEC-001, SEC-011 | Phiên ngẫu nhiên 256 bit, lưu hash phiên trong SQL, cookie HttpOnly/SameSite và Secure ngoài local. Phiên nghiệp vụ 30 phút, phiên thiết lập tối đa 10 phút. Yêu cầu CSRF cho ghi. Đổi, khôi phục hoặc khóa tài khoản thu hồi phiên. | Định tuyến API cùng origin. Quản lý khóa Data Protection dùng chung khi có nhiều replica. |
| SEC-002, SEC-004, SEC-024 | Dùng PBKDF2-SHA256 có salt riêng và 600.000 vòng. Tài khoản mới khóa cho đến khi mã kích hoạt được cấp. Mã có hạn 24 giờ và dùng để hoàn tất thiết lập Authenticator trước khi vào nghiệp vụ. | Bàn giao mã qua kênh đã xác minh và phân loại các bản sao cũ. Sao lưu và diễn tập chuyển đổi trước khi chạy migration thật. |
| SEC-003, SEC-013 | Bỏ connection string khỏi Git, yêu cầu TLS và kiểm chứng chứng thư SQL. Chặn API HTTP ở production sau proxy tin cậy. Cấu hình cookie cùng origin, CSP nonce, chống framing và tắt optimizer ảnh không dùng. | Xoay credential SQL từng môi trường. Xác minh proxy, chứng thư, DNS, ACL, HSTS và route API cùng origin trên ingress. |
| SEC-005, SEC-008, SEC-015, SEC-016, SEC-019 | Kiểm quyền, người tải, trạng thái pending, module và đơn vị khi gắn tệp. Ghi quan hệ cùng bản ghi nghiệp vụ. Dùng storage key riêng, scan PDF qua ClamAV ở production, stream tải xuống sau xác thực. Giới hạn kích thước, quota, thời gian pending và số upload đồng thời mỗi IP. Liên kết chứng chỉ chỉ chấp nhận origin HTTPS đã cấu hình. | Chỉ định private volume và scanner nội bộ. Đối soát các tệp lịch sử và thiết lập retention cho tệp đã gắn. |
| SEC-006, SEC-007, SEC-023 | Dùng vai trò staff hữu hạn và scope tập trung cho cây, thống kê và bản ghi. Tổ trưởng chỉ ghi khoản đoàn phí trong module tài chính. Quản trị hệ thống quản lý account, tổ chức và hồ sơ theo quyền đã áp dụng. Xác nhận cả đơn vị và đoàn viên khi ghi, giữ quyền duyệt cuối ở CDCS. Đổi tổ đi qua luồng chuyển và ghi lịch sử cùng transaction. | Chủ nghiệp vụ duyệt ma trận role hiện tại. Quyền tự phục vụ đoàn viên cần liên kết tài khoản–hồ sơ trước khi mở; role đó hiện bị từ chối ở nhóm API nhân sự và nghiệp vụ. |
| SEC-009 | Chỉ cho EF InMemory trong Development/Testing có cấu hình tường minh. Provider SQL cố định, readiness kiểm SQL và migration, job migration riêng. Giao diện bỏ fallback dữ liệu minh họa ở tổ chức/đoàn viên/thống kê. | Dùng readiness ở bộ định tuyến, cấp DML và DDL riêng. Kiểm tra trải nghiệm mất SQL với staging. |
| SEC-010, SEC-018 | Audit EF ghi actor, entity, action, trace và tên trường cho phép. API ghi mã trạng thái và trace. Lỗi trả thông báo an toàn với ProblemDetails, giữ trường message để UI tương thích. | Phân quyền log, thiết lập ngưỡng cảnh báo và xử lý bản sao audit lịch sử. |
| SEC-012, SEC-022 | Nâng .NET/EF và dependency frontend. Có lockfile, workflow locked restore, kiểm thử hồi quy HTTP, phân tích mã, quét secret có redaction, đối chiếu advisory offline và xuất CycloneDX. | Bật gate trên nhánh bảo vệ, kiểm SBOM của artifact thực tế và lịch cập nhật runtime. |
| SEC-014 | Giới hạn mật khẩu và OTP theo IP và tài khoản. TOTP bắt buộc cho mọi vai trò. Chỉ ID đã cấu hình của `qlcd_admin` có quyền đặt lại cho người khác. Đặt lại mật khẩu và đặt lại 2FA độc lập, cần OTP mới, thu hồi phiên và có audit. | Xác minh kênh giao mã, cấu hình ID tài khoản, áp hạn mức chia sẻ ở ingress khi có nhiều replica và diễn tập khôi phục. |
| SEC-017, SEC-020 | Phân trang có giới hạn ổn định; truy vấn danh sách giảm dữ liệu định danh. Bật validation pipeline, giới hạn body và multipart, dùng DTO và kiểm quan hệ có thẩm quyền. Thống kê tài chính tính tổng tại SQL. | Đo ngân sách truy vấn và tải với dữ liệu staging có quy mô đại diện. |
| SEC-021 | Có readiness SQL, cấu hình kho minh chứng riêng, job thu dọn phiên/tệp pending và yêu cầu mã hóa khi truyền tới SQL. | Xác nhận encryption at rest, phân quyền volume/DB/log, retention, backup đồng bộ DB/tệp/key ring và diễn tập restore trên môi trường thật. |

## Chạy phát triển

Yêu cầu .NET 10 SDK và Node đáp ứng phiên bản Next.js trong lockfile. Chạy từ thư mục gốc repo trong PowerShell. Mật khẩu tạm của môi trường local được nhập tương tác.

~~~powershell
$env:DOTNET_ENVIRONMENT = 'Development'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:Data__UseInMemory = 'true'
$env:Bootstrap__OnDevelopmentStart = 'true'
$env:Bootstrap__Username = 'qlcd-local'
$env:Bootstrap__ActivationCode = [System.Net.NetworkCredential]::new('', (Read-Host 'Mã kích hoạt riêng 32 ký tự hex' -AsSecureString)).Password
dotnet run --project backend/QLCD.Api --no-launch-profile -- --urls http://127.0.0.1:5023
~~~

Ở terminal khác, chạy `npm ci --no-audit --no-fund` và `npm run dev` trong `frontend/qlcd-web`, rồi mở frontend. Lần đăng nhập đầu yêu cầu đổi mật khẩu. ADMIN có thể tạo CĐCS khi cây trống. DB InMemory và tài khoản local được tạo lại khi khởi động theo cấu hình trên.

## Chuyển đổi môi trường có dữ liệu

1. Chọn cửa sổ bảo trì. Diễn tập restore bản sao đồng bộ SQL, tệp riêng và key ring vào môi trường cô lập. Lưu bằng chứng RPO/RTO, hệ thống nào phụ thuộc API v1 và danh mục tài khoản phải cấp lại.
2. Cấu hình bí mật ngoài repo. `ConnectionStrings__DefaultConnection` là principal runtime có quyền tối thiểu trên schema và quyền đọc lịch sử migration cho readiness. `ConnectionStrings__Migration` dành cho tiến trình DDL, cả hai kết nối yêu cầu chứng thư SQL được xác minh. Xoay thông tin SQL trước khi mở lại hệ thống.
3. Cấu hình `Security__DataProtectionKeyPath` là thư mục tuyệt đối riêng tư dùng chung các replica của cùng môi trường. Đặt PFX qua `Security__DataProtectionCertificatePath` và mật khẩu qua secret provider, giữ khóa giải mã phục vụ restore và rotation trong thời hạn. Chỉ định IP proxy tin cậy qua `Security__TrustedProxies__0` và các chỉ số tiếp theo. Ingress kết thúc HTTPS, chuyển `/api/v1` sang API cùng origin, giữ `Set-Cookie`, chuyển forwarded headers từ hop được tin và ngăn public truy cập SQL/ClamAV.
4. Dừng nhận yêu cầu ở artifact cũ. Chạy artifact backend với `--migrate` bằng identity DDL đã cấu hình. Migration bảo mật xóa cột plaintext, vô hiệu hóa mọi mật khẩu trên bảng tài khoản cũ và xóa giá trị chi tiết trong audit đã tích lũy. Giữ log và backup trước thời điểm chuyển đổi theo quyền, retention và pháp lý đã duyệt. `--initialize-data` chỉ khởi tạo danh mục tham chiếu nếu cần.
5. Tạo ADMIN mới bằng `--bootstrap-admin` hoặc cấp mã thiết lập cho ADMIN đang hoạt động chưa có Authenticator bằng `--issue-mfa-enrollment`. Cấu hình `Security__CredentialResetAccountId` bằng ID đã xác minh của `qlcd_admin`. Dùng `--provision-account` qua kênh vận hành khi cần khôi phục khẩn cấp chính tài khoản này. Cấp `Bootstrap__Username` và mã 32 ký tự hex riêng từ kho bí mật qua `Bootstrap__ActivationCode`, bàn giao mã qua kênh đã xác minh rồi dọn biến cấp tạm. [Chi tiết bảo mật](../SECURITY.md) · [Quy trình khôi phục](../ACCOUNT_RECOVERY.md)
6. Đặt `Storage__Root` là volume tuyệt đối riêng, có quota và ACL tối thiểu. Cấu hình ClamAV riêng qua `Storage__MalwareScannerHost`, tùy chọn `Storage__MalwareScannerPort` và cho phép scan stream tối đa 20 MiB. Thiết lập dung lượng đệm multipart ở môi trường hosting. `Storage__LegacyRoot` cho phép đọc lại tệp hợp lệ ở đường dẫn cũ dưới root đã duyệt. Khi đổi máy/OS, đối soát metadata và bytes trước cutover. `Security__CertificateOrigins__0` khai báo origin HTTPS của kho chứng chỉ được duyệt, nếu cần.
7. Deploy API và UI tương thích, xác nhận `/health/ready`, đăng nhập MFA, đổi mật khẩu, quyền chéo đơn vị, download và job backup. Đặt liveness/readiness ở mạng quản trị. Bảo toàn database và file storage trong diễn tập.

Đối chiếu lịch sử Git, các image/binary cũ, log và backup bằng quy trình nội bộ có redaction. Khóa JWT và credential SQL cũ đã từng xuất hiện trong mã hoặc cấu hình cần coi là vật liệu phải thu hồi nếu đang sử dụng. Việc đổi phiên bản không xóa giá trị từ lịch sử Git hoặc bản sao đã phát hành.

## Vận hành và khôi phục

- Luồng bắt buộc dùng mã kích hoạt khi liên kết thiết bị đầu tiên, OTP khi đổi mật khẩu, mã khôi phục để thay Authenticator và xác thực lại quản trị viên khi đặt lại tài khoản. Đồng bộ thời gian máy chủ và bảo vệ key ring trong bản sao lưu để khóa Authenticator vẫn đọc được sau phục hồi. [Quy tắc và thời hạn](../TWO_FACTOR_AUTHENTICATION.md) · [Khôi phục tài khoản](../ACCOUNT_RECOVERY.md)
- Trên máy Windows local, `./tools/test-sql.ps1 -RehearseRestore` diễn tập sao lưu SQL bằng dữ liệu tổng hợp. Script tạo cơ sở dữ liệu riêng, dùng `BACKUP ... WITH COPY_ONLY, CHECKSUM`, xác minh checksum, khôi phục sang tên khác rồi kiểm tra `DBCC CHECKDB`, lịch sử migration và hồ sơ kết nạp. Dùng `-TestsDll` để chọn DLL kiểm thử đã build ngoài thư mục mặc định. Bước này chỉ kiểm chứng SQL Server. Sao lưu và phục hồi đồng bộ tệp minh chứng, key ring và bí mật cần diễn tập trên môi trường đích.
- Lập lịch `--expire-sessions` trên SQL. Với tệp pending đã quá hạn và chưa gắn bản ghi, `--expire-pending-evidence` dọn tối đa 100 tệp mỗi lượt theo `Storage__PendingRetentionDays` được phê duyệt (2–365). Tệp đã gắn hoặc bản sao lịch sử dùng quy trình retention/legal hold riêng. Đối soát định kỳ các tệp mồ côi sau lỗi kết nối hoặc phục hồi.
- Cảnh báo ở ingress và log collector cho đăng nhập thất bại, 403 theo scope, reset/khóa tài khoản, quota, tình trạng SQL, scanner và tuổi bản sao. Chủ sở hữu vận hành duyệt ngưỡng theo tải thật. Sự kiện DB từ CLI có actor hệ thống và cần ghép nhật ký tài khoản vận hành.
- Khi cutover lỗi, giữ cơ chế kiểm soát truy cập bên ngoài hoặc chế độ bảo trì. Migration xóa credential/audit lịch sử không hỗ trợ downgrade. Dùng artifact vá tương thích hoặc forward fix. Chỉ restore bản sao trước chuyển đổi trong vùng cô lập và xoay credential trước khi phục vụ lại.

## Kiểm chứng kỹ thuật

Tại máy làm việc, backend và frontend build thành công, 9 test xUnit đều qua và kiểm thử HTTP dùng dữ liệu tổng hợp đã qua. Kiểm tra Next production xác nhận nonce thay đổi theo request và optimizer ảnh bị đóng. EF xác nhận migration khớp model và sinh được SQL idempotent. Quét OSV offline trên các lockfile npm/NuGet sau cập nhật không báo advisory áp dụng từ dữ liệu đã tải. ESLint toàn frontend còn báo lỗi kiểu TypeScript và quy tắc React Hooks.

- Backend build và xUnit dùng `dotnet build backend/QLCD.sln` và `dotnet test backend/QLCD.sln`.
- `node tools/test-security-smoke.mjs` khởi chạy API thử nghiệm loopback, tự cấp dữ liệu tổng hợp và kiểm phiên, reset, phân quyền, phân trang và download.
- Frontend dùng `npm ci` và `npm run build` trong `frontend/qlcd-web`. [Workflow bảo mật](../../.github/workflows/security.yml)
- SQL migration có thể sinh script idempotent bằng EF CLI để duyệt trước cutover. Nghiệm thu SQL Server, ClamAV, backup, MFA production, ingress và CI cần sử dụng artifact và cấu hình của môi trường đích. [Checklist](07-security-checklist.md)
