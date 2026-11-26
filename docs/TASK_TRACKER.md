# Theo dõi cải tiến QLCD

Ngày rà soát 25/11/2026. Đường cơ sở là working tree có sẵn đợt hardening ngày 23/11/2026.

| Ưu tiên | Công việc | Trạng thái | Bằng chứng hoặc điều kiện |
| --- | --- | --- | --- |
| P0 | Xác lập đường cơ sở và bảo toàn thay đổi đang có | Completed | Backend build, 9/9 xUnit, HTTP smoke và frontend build qua. Lint có 86 lỗi, 19 cảnh báo. |
| P0 | Sửa khả năng chạy lại migration hardening | Completed | Script chạy hai lần trên schema trống và schema cũ tổng hợp. Một lần nâng cấp loại bỏ dữ liệu credential cũ và giá trị audit. |
| P1 | Đối chiếu vai trò và luồng hiện hành | Completed | Smoke xác thực, phạm vi, transfer đồng thời và minh chứng. Trình duyệt kiểm tạo/sửa các hồ sơ được liệt kê ở báo cáo. |
| P1 | Thay báo cáo mẫu và sửa tổng thu chi | Completed | Tổng hợp thi đua theo năm, thu chi tính trước phân trang và tháng thống kê theo giờ Việt Nam. |
| P1 | Kiểm tra schema và truy vấn SQL | Completed | EF không báo model drift. Bốn ca SQL Express gồm rollback khi hai phiên cập nhật cùng hồ sơ. |
| P2 | Sửa lint, tải dữ liệu và kiểu hợp đồng | Completed | Lint 0 lỗi, 0 cảnh báo, API client có kiểu và hủy request khi thay bộ lọc. |
| P2 | Responsive, accessibility và lỗi khi tải | Completed | 13 trang × 7 chiều rộng trên Chromium. Axe ghi nhận kết quả trong report.json. |
| P2 | Tài liệu, kỹ năng và hướng dẫn vận hành | Completed | README, cấu hình mẫu, AGENTS.md, tám skill, audit và báo cáo cuối. |
| P1 | Chốt phần nghiệp vụ mở rộng | Blocked | Tiếp nhận trực tiếp tại CĐBP chưa có tổ đã hoàn tất. Chủ nghiệp vụ cần duyệt luồng phê duyệt hai cấp, chuyển ngoài viện, tự phục vụ, biểu mẫu và quy tắc xếp loại chính thức. |
| P1 | Nghiệm thu staging/production | Blocked | Đã diễn tập phục hồi SQL bằng dữ liệu mẫu. Cần hạ tầng đích, giấy phép, xác thực MFA, xoay thông tin xác thực, duyệt ma trận và thử phục hồi đồng bộ SQL, tệp và key ring. |
| P2 | Nghiệm thu khả năng truy cập và hiệu năng vận hành | Pending | Cần screen reader, trình duyệt bổ sung, thiết bị thật và tập dữ liệu/tải đại diện. |

[Báo cáo tổng kết](FINAL_REPORT.md) · [Kế hoạch ưu tiên](PROJECT_AUDIT.md)

## Hồi quy thêm đoàn viên ngày 25/11/2026

- Đã sửa luồng cán bộ nhập hồ sơ trực tiếp. Nút mở hướng dẫn khi chưa có tổ hoạt động. Form tự chọn tổ của tài khoản hoặc tổ duy nhất đủ điều kiện và hiển thị liên kết tới hồ sơ mới.
- API kiểm tra tuổi từ ngày sinh đến ngày vào công đoàn, ngày cấp chứng chỉ, phạm vi tổ và định danh trùng. Công việc dùng schema hiện có.
- Build Release, lint, typecheck, 12 xUnit mặc định và HTTP smoke qua. Browser smoke qua 13 nhóm, gồm cơ sở dữ liệu ban đầu chưa có tổ, tuổi sát ngưỡng 18 và lưu chứng chỉ trong lần tạo. [Kịch bản browser](../frontend/qlcd-web/tests/browser.mjs) · [Kịch bản API](../tools/test-security-smoke.mjs)

## Kiểm chứng phân cấp tổ chức

- Đã xác nhận CĐBP có thể có 0, 1 hoặc nhiều tổ. Cây tổ chức hiển thị CĐBP chưa có tổ và phân biệt thao tác thêm tổ dưới CĐCS hoặc CĐBP.
- Danh sách chọn tổ khi thêm đoàn viên hiển thị tên đơn vị cấp trên. Đã kiểm chứng hai loại tổ đều chọn được và CĐBP chưa có tổ vẫn hiện trong cây.
- 12 xUnit mặc định, build, lint, typecheck và browser smoke qua. [Quy tắc phân cấp](03-Business-Rules.md) · [Kịch bản browser](../frontend/qlcd-web/tests/browser.mjs)

## Tiếp nhận đoàn viên trực tiếp tại CĐBP chưa có tổ

- API và danh sách đơn vị tiếp nhận dùng chung quy tắc. CĐBP cần đang hoạt động và chưa có tổ trong cơ cấu. Tổ ngừng hoạt động vẫn được tính. Khi CĐBP lập tổ, hồ sơ tiếp nhận trực tiếp vẫn ở CĐBP cho đến khi chuyển sinh hoạt. Thay đổi dùng schema hiện có.
- `dotnet build` Release và `dotnet test` qua 13 kiểm thử mặc định. Nhóm `ReportQueriesTests` qua 5 kiểm thử trên cơ sở dữ liệu SQL Express tổng hợp được tạo từ migration hiện hành, gồm tiếp nhận trực tiếp và xử lý tổ ngừng hoạt động.
- `node tools/test-security-smoke.mjs` qua các bước tiếp nhận, kiểm tra phạm vi, giữ hồ sơ khi lập tổ và chuyển sinh hoạt. `npm run lint`, `npm run typecheck`, `npm run build` và `npm run test:browser` đều qua. Playwright đã đăng nhập với vai trò CĐBP, kiểm tra đơn vị được chọn sẵn và mở hồ sơ vừa tạo. [Quy tắc tiếp nhận](03-Business-Rules.md) · [Kịch bản browser](../frontend/qlcd-web/tests/browser.mjs) · [Kịch bản API](../tools/test-security-smoke.mjs)

## Phiên local lưu dữ liệu trên SQL Server Express

- Đã khởi tạo riêng `QLCD_Local` trên `.\SQLEXPRESS` bằng `--migrate`, `--initialize-data` và `--bootstrap-admin`. SQL Server báo đã áp dụng ba migration và phiên API dùng xác thực Windows qua bộ nhớ chia sẻ có mã hóa. Phiên local mở ở `http://127.0.0.1:3003` và dùng cơ cấu tổ chức cùng hồ sơ tổng hợp.
- Build Release và 13 xUnit mặc định qua. `tools/test-sql.ps1` qua hai cơ sở dữ liệu tổng hợp, gồm schema trống và schema cũ. Trên bản chạy SQL, Playwright đã đăng nhập quản trị và CĐBP, thêm hồ sơ `SQL-SMOKE-001`, rồi mở lại hồ sơ sau khi khởi động lại API. Truy vấn trực tiếp xác nhận hồ sơ thuộc CĐBP và có một dòng lịch sử kết nạp. [Cấu hình SQL local](../README.md#chạy-local-với-sql-server-express)

## Giao diện theo màu sắc Công đoàn Việt Nam

- Đã áp dụng tông xanh cô-ban với nền làm việc sáng, đổi bố cục đăng nhập và tổng quan, làm rõ bảng, biểu mẫu và trạng thái. Ảnh minh họa nhân viên y tế dùng chung được tối ưu ở định dạng WebP. [Thiết kế giao diện](DESIGN_SYSTEM.md)
- Build Release, 13 xUnit mặc định, HTTP smoke, lint, typecheck và production build đều qua. Playwright qua 16 luồng. Kết quả trên 13 trang ở 7 chiều rộng ghi nhận 91 ảnh, không tràn ngang, không lỗi JavaScript hoặc lỗi API ngoài dự kiến. Axe không ghi nhận vi phạm trên các trang đã quét. Đã kiểm tra mở biểu mẫu bằng Enter và trả tiêu điểm khi nhấn Escape. [Kịch bản trình duyệt](../frontend/qlcd-web/tests/browser.mjs)
- Đã cập nhật giao diện tại cổng `3003`, kiểm tra đăng nhập bằng tài khoản CĐBP và mở hồ sơ `SQL-SMOKE-001` từ `QLCD_Local`.

## Tìm tài khoản và diễn tập phục hồi SQL

- Tìm theo tên đăng nhập, tên người quản lý hoặc đơn vị trước khi phân trang. API giữ bộ lọc xóa mềm, giới hạn từ khóa 100 ký tự và trả `hasMore` theo kết quả đã lọc. UI hiển thị trực tiếp kết quả API.
- Build Release và 14 xUnit mặc định qua. HTTP smoke kiểm thử tìm một tài khoản nằm ngoài trang đầu và từ khóa quá dài. Playwright qua 17 luồng, gồm gửi bộ lọc từ UI tới API rồi xóa bộ lọc. Lint, typecheck và production build qua.
- `tools/test-sql.ps1 -RehearseRestore` qua 6 kiểm thử trên SQL Express và nâng schema cũ mẫu. SQL xác minh checksum bản sao, khôi phục vào database riêng, chạy `DBCC CHECKDB` và tìm lại hồ sơ cùng lịch sử kết nạp. Bài diễn tập dùng dữ liệu tổng hợp. Cần nghiệm thu phục hồi tệp minh chứng và key ring tại môi trường đích. [Hướng dẫn diễn tập](security-audit/08-remediation-status.md#vận-hành-và-khôi-phục)

## Xác thực hai bước bằng Authenticator

- Đã thêm mục **Bảo mật tài khoản** với QR, khóa thủ công, xác nhận mã TOTP và tùy chọn tắt cho tài khoản được phép. Khóa được bảo vệ bằng Data Protection và dùng schema hiện có. Bước mật khẩu cấp yêu cầu xác thực 3 phút. Bật hoặc tắt làm phiên cũ hết hiệu lực.
- Build Release, 14 xUnit mặc định, lint, typecheck và production build đều qua. HTTP smoke qua trên InMemory và database SQL Express tổng hợp riêng, gồm từ chối yêu cầu bị sửa, kiểm hai yêu cầu xác nhận đồng thời và chỉ cho một yêu cầu dùng cùng mã thành công. EF báo model khớp migration.
- Playwright qua 18 luồng với 98 ảnh ở 7 chiều rộng. Đã kiểm tra QR hiển thị, bật bằng mã từ khóa mẫu, đăng xuất và đăng nhập qua bước Authenticator riêng. Bản SQL `3003` đã kiểm tra đăng nhập, hiển thị và hủy thiết lập QR. Nghiệm thu quét bằng thiết bị di động thật còn chờ. [Hướng dẫn khôi phục và vận hành](security-audit/08-remediation-status.md#vận-hành-và-khôi-phục)

## Bắt buộc Authenticator và hoàn thiện khôi phục tài khoản

- Tất cả vai trò dùng Authenticator. Mật khẩu khởi tạo và mã kích hoạt mở luồng thiết lập, phiên nghiệp vụ cần OTP và hoàn tất đổi mật khẩu khi được yêu cầu. Tài khoản cũ giữ mật khẩu. Đã bổ sung mã khôi phục, xác thực lại quản trị viên và audit thay đổi.
- Build Release, lint, typecheck và production build qua. `dotnet test` qua 15 kiểm thử mặc định. 6 ca SQL và diễn tập phục hồi qua, gồm nâng schema từ dữ liệu mẫu cũ và xác nhận hash mật khẩu, khóa TOTP và bước đã dùng được giữ nguyên. EF báo schema khớp model.
- HTTP smoke qua InMemory và SQL Express riêng. Kết quả gồm chặn API trong phiên giới hạn, sai hoặc hết hạn OTP, hạn mức, OTP đồng thời, thu hồi phiên, từ chối mật khẩu khởi tạo khi đổi, xoay mã sau khôi phục và đặt lại bởi quản trị viên. Playwright qua 20 luồng, 98 ảnh, 7 chiều rộng, không có lỗi API ngoài dự kiến hoặc vi phạm axe trên trang đã quét.
- Bản thử riêng cổng `3004` dùng `QLCD_MFA_Demo` và trả readiness Healthy. Đã xác nhận đăng nhập khởi tạo chỉ mở bước nhập mã kích hoạt và API quản trị trả 403. `QLCD_Local` chưa áp migration. Nghiệm thu quét thiết bị thật và môi trường triển khai còn chờ. [Báo cáo hoàn thiện 2FA](2FA_IMPLEMENTATION_REPORT.md)

## Chính sách mật khẩu và đặt lại riêng mật khẩu, 2FA

- Backend và giao diện dùng cùng chính sách mật khẩu. Hai thao tác quản trị yêu cầu ID cấu hình của `qlcd_admin`, xác nhận và OTP mới. Mỗi thao tác thu hồi phiên đích, ghi audit và giữ thông tin xác thực còn lại.
- `dotnet build -c Release` qua với 0 cảnh báo và 0 lỗi. `dotnet test` qua 26 ca, 1 ca cần SQL được chạy trong `tools/test-sql.ps1 -RehearseRestore`. Bộ SQL qua 6 ca, kiểm schema trống, dữ liệu cũ, script chạy lặp và phục hồi bản sao. `dotnet ef migrations has-pending-model-changes` xác nhận migration khớp model.
- `npm run lint -- --max-warnings 0`, `npm run typecheck` và `npm run build` đã qua. HTTP smoke InMemory kiểm tra gọi trực tiếp API, quyền reset, OTP và trạng thái sau từng reset.
- `npm run test:browser` qua 21 luồng và 98 ảnh trên 7 chiều rộng, gồm kiểm chính sách mật khẩu tại chỗ và hai hộp thoại reset. Không có lỗi trình duyệt, lỗi API ngoài dự kiến hoặc vi phạm axe trên 14 màn hình đã quét.
- `node tools/test-security-smoke.mjs --sql-local` qua trên SQL Server Express riêng. Kiểm tra ADMIN khác bị từ chối cả hai API, OTP không dùng lại, phiên đích bị thu hồi và audit giữ đúng người thực hiện, đối tượng và loại thao tác. Cấu hình quyền và migration chưa áp dụng cho cơ sở dữ liệu đang sử dụng. [Triển khai và khôi phục](SECURITY.md)
- Ngày 25/11/2026, kiểm tra cổng `3003` xác nhận frontend và API đang chạy bản 15 ký tự. Đã sao lưu SQL fixture `QLCD_Local` bằng `COPY_ONLY, CHECKSUM`, chạy `RESTORE VERIFYONLY`, áp hai migration bằng `--migrate` và chuyển cổng `3003` sang bản Release hiện hành. Đã xác nhận bản băm, Authenticator, bước OTP và dấu phiên của `qlcd_admin` được bảo toàn qua migration. Trang đăng nhập và CSRF trả HTTP 200, readiness `Healthy`, bundle dùng tối thiểu 8 ký tự. Chủ tài khoản thực hiện xác thực OTP trên thiết bị của mình.
- Đã chuyển bản Release dùng `QLCD_Local` sang điểm truy cập chung `http://127.0.0.1:3000` cho giao diện và `/api/v1`. Các bản xem trước và bản demo ở `3001`–`3004` đã dừng. Xác nhận trang đăng nhập, CSRF và readiness từ cổng `3000`.
- Lỗi đăng nhập local sau khi cấp lại mật khẩu xuất phát từ bản băm sai định dạng. Đã xác nhận các phản hồi 401 và 429 trong log, sửa bản băm bằng `PasswordHasher` của bản Release và xác minh giá trị đọc lại từ SQL trước khi commit. Khởi động lại API local để xóa bộ đếm đã tích lũy. Readiness đạt `Healthy` và Authenticator vẫn bật.

## Khởi chạy SQL Server local trên macOS ngày 26/11/2026

- Đã kết nối SQL Server Docker trên localhost:1433 và tạo riêng QLCD_Local bằng migrations hiện hành, khởi tạo danh mục và quản trị local. Thông tin kết nối cùng mã kích hoạt nằm trong tệp local được Git bỏ qua.
- API hỗ trợ appsettings.Local.json, giữ ưu tiên biến môi trường/tham số dòng lệnh. TrustLocalSqlCertificate chỉ có hiệu lực trong Development trên loopback, không failover; vẫn bắt buộc mã hóa. Có 8 ca kiểm thử giới hạn ngoại lệ.
- Backend build qua không warning/error; 34 xUnit qua, 1 ca SQL concurrency bỏ qua do chưa cấu hình fixture SQL của test. Frontend lint, production build và typecheck qua. HTTP readiness SQL trả 200.
- Bộ HTTP smoke tổng hợp chưa qua: POST /api/v1/activities trả 400 tại tools/test-security-smoke.mjs:105 khi dùng minh chứng vừa upload; chưa sửa luồng nghiệp vụ ngoài phạm vi khởi chạy local. Không chạy browser suite vì không thay đổi giao diện.

## Hủy an toàn các bước xác nhận ngày 26/11/2026

- Đã rà soát toàn bộ `FormDialog`, xác nhận native và các bước xác nhận trên trang tài khoản/bảo mật. Thêm `DialogCloseButton` chung (44×44 px, nhãn truy cập, focus, sticky khi cuộn) cho biểu mẫu, cấp mã/reset, chuyển sinh hoạt và tạo lại mã khôi phục. Chín vị trí xác nhận xóa (danh mục, tổ chức, đoàn viên ở danh sách/hồ sơ, hoạt động, tài chính, sáng kiến, thi đua, tệp minh chứng) dùng `useConfirmation` có X/Hủy/Đồng ý.
- X/Escape/Hủy không submit hay gọi API ghi. Hook giải quyết từ chối khi unmount; biểu mẫu tài khoản xóa thông tin nhập nhạy cảm khi đóng. Trong lúc gửi yêu cầu, khóa X/Escape. Hộp thoại con chỉ hủy chính nó; focus trở lại nút mở. Các API nghiệp vụ, quyền và yêu cầu MFA không thay đổi.
- Đã bổ sung hồi quy trong `frontend/qlcd-web/tests/browser.mjs`: điền rồi hủy reset và mở lại sạch, kích hoạt bị hủy/đồng ý, X bị khóa khi đang gửi, đủ chín luồng xóa qua X/Escape/Hủy không có request ghi, lỗi DELETE tổng hợp và thử lại, Đồng ý chỉ gửi một lần, hủy chuyển sinh hoạt/tạo lại mã khôi phục, hộp xác nhận tệp nằm trong biểu mẫu, focus và màn hình thấp 360×480. Các biểu mẫu nghiệp vụ cũng được đóng/mở lại trước khi lưu thành công.
- `dotnet build backend/QLCD.sln` qua, 0 warning/error; `dotnet test backend/QLCD.sln --no-build` qua 34 test, 1 ca concurrency SQL bỏ qua vì thiếu fixture SQL. Frontend `npm run lint -- --max-warnings 0`, `npm run build`, `npm run typecheck` đều qua.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 node tools/test-security-smoke.mjs` qua. Browser smoke với cùng locale và Chrome trên macOS qua 23 nhóm luồng, 98 ảnh cho 14 trang, 0 tràn ngang, 0 lỗi JS/API ngoài dự kiến, 0 vi phạm axe trên các trang đã đo. Báo cáo: `artifacts/browser/after/report.json`; ảnh nút X: `activation-confirmation-360.png` và `activation-confirmation-1920.png` trong cùng thư mục.
- Giới hạn: smoke dùng InMemory và dữ liệu/tệp tổng hợp, chưa kiểm thử trình duyệt với SQL hay thiết bị thật. Lượt chạy dùng locale mặc định C.UTF-8 vẫn gặp lỗi 400 cũ ở POST /api/v1/activities; chạy lại với en_US.UTF-8 qua toàn bộ, không sửa nghiệp vụ ngoài phạm vi nút hủy.

## Thống nhất mật khẩu và tạo đơn vị ngày 26/11/2026

- Rà soát toàn bộ nơi tạo/ghi mật khẩu: tạo tài khoản cùng đơn vị, bootstrap/provision CLI, cấp mã cho tài khoản cũ, reset mật khẩu, reset 2FA và đổi mật khẩu cá nhân. Mật khẩu khởi tạo/reset mật khẩu đều là `PasswordHasher.InitialPassword` (`123456aA@`), không cấu hình qua appsettings. Hash khác nhau do salt riêng. Reset 2FA/cấp mã cho tài khoản cũ giữ mật khẩu; CLI khôi phục khẩn cấp reset cả mật khẩu và MFA. Đã ghi bảng đối chiếu trong AUTHENTICATION.md và ACCOUNT_RECOVERY.md.
- Giữ cơ chế bắt buộc đổi mật khẩu, MFA và thu hồi phiên. Gom thời hạn mật khẩu/mã kích hoạt thành hai hằng riêng (đều 24 giờ) tại AccountCredentials. GET accounts bổ sung credentialPolicy để thông báo quản trị lấy đúng giá trị từ backend. UI nêu rõ kết quả reset, thời hạn, MFA/trạng thái khóa được giữ; người dùng được nhắc bắt buộc đổi mật khẩu; sau tạo đơn vị admin được hướng dẫn vào Tài khoản để kích hoạt.
- Tên đơn vị trước đây không được backend thêm tiền tố; prefix nằm ở tên đăng nhập tự sinh. Đã bỏ thêm cdcs_/cdbp_/tocd_ và bỏ cắt các cụm từ theo loại đơn vị. Tên người dùng nhập được truyền/lưu nguyên chuỗi; chỉ chuẩn hóa tên đăng nhập để dùng làm định danh. Tài khoản trùng được thêm hậu tố số. API không có trường mã đơn vị chuỗi (ID là GUID). Không migration hoặc cập nhật các đơn vị/tài khoản hiện có.
- Bổ sung 14 ca xUnit: đủ bốn loại đơn vị, tên và dữ liệu cũ giữ nguyên, tên đăng nhập không prefix và không cắt từ đã nhập, trùng tên/salt khác nhau, reset cho ADMIN/CDCS/CDBP/TOCD ở cả trạng thái khóa/mở, MFA/phiên/hạn dùng và kích hoạt mới so với tài khoản cũ. Tổng 48 test qua, 1 ca SQL concurrency bỏ qua do thiếu fixture SQL.
- `dotnet build backend/QLCD.sln`: qua, 0 warning/error. Frontend lint max-warnings 0, production build và typecheck qua. HTTP smoke bổ sung kiểm tra credentialPolicy và qua toàn bộ. Browser smoke thêm kiểm tra tên có khoảng trắng nhập từ UI được lưu nguyên, bốn tên đăng nhập không prefix, thông báo mật khẩu từ API, reset mật khẩu thật qua UI và đăng nhập/đổi mật khẩu sau đó: qua 25 nhóm luồng, 98 ảnh, không tràn ngang/lỗi JS/API ngoài dự kiến; 0 vi phạm axe trên 14 trang đã đo.
- HTTP/browser chạy trên fixture InMemory tổng hợp với LANG/LC_ALL=en_US.UTF-8 và Chrome trên macOS. Không thao tác reset hay tạo đơn vị thử trên database người dùng. Đã khởi động lại API local với bản mới; không chạy migrate/initialize/bootstrap lại.

## Bảo toàn tổ chức và tài khoản khi gỡ khỏi cây ngày 26/11/2026

### Nguyên nhân và mô hình đã chọn

- Luồng cũ: nút Xóa Đơn vị → DELETE /api/v1/union-units/{id} → DeleteUnionUnitCommand đặt IsDeleted=true cho đơn vị và toàn bộ tài khoản trực tiếp. Global query filter IsDeleted=false trong QLCDDbContext khiến GetAccountsQuery bỏ các tài khoản đó; khóa tài khoản bị trộn với xóa mềm đơn vị. UpdateUnionUnit còn có đường đổi trạng thái khác và tự ghi đè HoTen tài khoản.
- Mô hình mới: ngừng đơn vị dùng TrangThai=0, không hard/soft-delete đơn vị/tài khoản/quan hệ. Tài khoản giữ cờ khóa riêng; truy cập hiệu lực yêu cầu tài khoản mở, không lưu trữ và đơn vị cùng toàn bộ tổ tiên hoạt động. Do vậy tài khoản có thể hiển thị “Đã mở khóa” nhưng đồng thời “Bị chặn truy cập do đơn vị”; không tự đổi cờ khóa khi ngừng/khôi phục đơn vị.
- Chặn ngừng CĐCS và bất kỳ đơn vị có con nào, kể cả con ngừng/soft-delete cũ. Không cascade trạng thái. Đơn vị lá có đoàn viên/nghiệp vụ được ngừng mà giữ toàn bộ dữ liệu/FK. Tất cả tài khoản trực tiếp vẫn hiện và bị chặn bởi đơn vị. Ngừng thu hồi phiên trực tiếp; khôi phục nhánh dữ liệu cũ còn thu hồi phiên thuộc nhánh con tối đa ba cấp, không đổi cờ khóa, mật khẩu/MFA hay trạng thái con. Phiên cũ không được sống lại.
- Legacy IsDeleted của đơn vị/tài khoản tổ chức chỉ được đọc trong danh sách quản trị; không tự backfill. Khôi phục đơn vị và mở khóa/khôi phục tài khoản là hai hành động tường minh theo ID cũ. Cha phải hoạt động trước khi khôi phục con. Mở khóa tài khoản không tạo hay khôi phục đơn vị; khôi phục đơn vị không mở khóa tài khoản. ADMIN vẫn dùng quy trình quản trị vòng đời riêng, không toggle tự phục hồi.

### Thay đổi theo lớp

- UI: thay Xóa bằng Ngừng hoạt động / Ẩn khỏi cây, giải thích phạm vi ảnh hưởng trong xác nhận; chặn nút cho cha có con. Khu vực ngừng hoạt động/lưu trữ cũ có phân trang và khôi phục riêng. Form sửa thông tin không đổi trạng thái. Tài khoản hiển thị riêng khóa tài khoản, lưu trữ cũ và chặn do đơn vị. X/Escape/Hủy tiếp tục không gửi thao tác ghi.
- API/controller: giữ DELETE v1 với nghĩa ngừng hoạt động; thêm GET /union-units/inactive và POST /union-units/{id}/restore, chỉ ADMIN/CDCS. PUT metadata từ chối chuyển trạng thái. Lỗi trạng thái 409 hiển thị thông báo nghiệp vụ cố định, không lộ exception nội bộ. GET accounts bổ sung organizationActive/accountArchived/canSignIn và giữ tài khoản tổ chức soft-delete cũ trong danh sách quản trị.
- Handler: OrganizationLifecycle dùng cùng transaction Serializable, kiểm tra con kể cả IsDeleted, giữ nguyên ID/FK, audit ORG_DEACTIVATE/ORG_RESTORE, thu hồi phiên qua SecurityVersion. Account toggle chỉ thay cờ/tombstone tài khoản và phiên bản bảo mật. Update metadata không ghi đè tên tài khoản.
- Quyền/truy vấn: OperationalUnits kiểm tra chuỗi tổ tiên tối đa ba cấp tại login, session, scope, cây hoạt động và lựa chọn tiếp nhận đoàn viên. Cả ADMIN liên kết đơn vị và CDCS đều không được bỏ qua chặn do đơn vị. ADMIN hệ thống không gắn đơn vị vẫn quản trị được khôi phục. Dữ liệu tổ chức lỗi/cha không khả dụng không được tự sửa.
- EF/schema: không đổi QLCDDbContext/model, FK hay migration. Bổ sung truy vấn quản trị IgnoreQueryFilters có chủ đích; các kiểm tra quyền dùng điều kiện IsDeleted/trạng thái rõ ràng. Không chạy migration/backfill/chỉnh trạng thái trong database người dùng.

### Kiểm chứng và giới hạn

- `dotnet build backend/QLCD.sln --nologo`: qua, 0 warning/error. `dotnet test backend/QLCD.Tests --nologo`: 58 qua, 1 kiểm thử concurrency chuyển đoàn viên bỏ qua do không cấu hình fixture SQL cho nhóm cũ.
- Với `QLCD_TEST_ORG_SQL_CONNECTION` trỏ seed test được bảo vệ bằng tên QLCD_Test_, `dotnet test backend/QLCD.Tests --no-build --filter FullyQualifiedName~OrganizationLifecycleTests --nologo`: 10/10 qua trên SQL Server Docker thật. Mỗi ca tạo database GUID riêng, xác nhận HasPendingModelChanges=false, apply migrations hiện hành, chạy fixture (bao gồm trạng thái legacy IsDeleted) và dọn đúng database của nó. Không dùng QLCD_Local hay database triển khai làm fixture.
- Hồi quy bao gồm nhiều tài khoản khóa/mở cùng đơn vị, giữ đoàn viên và hoạt động/FK, account vẫn hiện sau ngừng, mở khóa không sửa cây, phục hồi cùng ID, tài khoản lưu trữ cũ phục hồi độc lập, cha ngừng chặn đăng nhập/scope của con, ADMIN/CDCS có liên kết cũng không vượt chặn, thu hồi phiên, từ chối đơn vị có con kể cả inactive/IsDeleted, chặn metadata đổi trạng thái, quyền sai và yêu cầu lặp idempotent/không ảnh hưởng nhánh khác.
- Frontend lint max-warnings 0, production build và typecheck đều qua. HTTP smoke với LANG/LC_ALL=en_US.UTF-8 qua toàn bộ, gồm phiên thật bị thu hồi, đăng nhập/nghiệp vụ bị chặn, toggle không khôi phục đơn vị và khôi phục đơn vị không mở khóa tài khoản. Fixture có thêm một cửa sổ quota để kiểm thử dài không vượt rate limit thật; không giảm quota sản phẩm.
- Browser smoke cuối chạy tuần tự với Chrome trên macOS: 26 nhóm luồng qua, 98 ảnh ở 7 kích thước, 0 tràn ngang, 0 lỗi JS/API ngoài dự kiến, 0 vi phạm axe ở 14 trang. Có luồng GUI ngừng → tài khoản còn/bị chặn → khóa/mở tài khoản nhưng cây không đổi → khôi phục riêng theo cùng ID. X/Escape/Hủy tiếp tục được kiểm thử không gửi request ghi. Báo cáo `artifacts/browser/after/report.json`.
- Lượt chạy đồng thời trước đó gặp timeout tài nguyên và lượt smoke mở rộng đầu tiên vượt quota fixture; các lượt tuần tự cuối đã qua. Chưa stress-test transaction tổ chức đồng thời hoặc nghiệm thu hạ tầng production/thiết bị thật. Các bản ghi cha/quan hệ không hợp lệ ngoài mô hình ba cấp cần kiểm kê tường minh, không tự tái tạo/sửa quan hệ. Không thực hiện backfill hay khôi phục trạng thái trong dữ liệu người dùng.
- Đã khởi động lại API local sau kiểm thử, không chạy migrate/initialize/bootstrap. Readiness SQL và giao diện local trả HTTP 200.
