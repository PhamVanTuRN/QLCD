# Kiến trúc, dữ liệu và quyền hiện hành

QLCD phục vụ quản trị viên và cán bộ công đoàn. Cây tổ chức có một CĐCS, các CĐBP và các tổ. Một tổ có thể trực thuộc CĐCS hoặc CĐBP. Có thể tiếp nhận đoàn viên tại tổ đang hoạt động hoặc tại CĐBP đang hoạt động chưa có tổ. Khi cần chuyển đoàn viên về tổ đang hoạt động, dùng chức năng chuyển sinh hoạt. [Quy tắc nghiệp vụ](03-Business-Rules.md)

| Thành phần | Công nghệ và trách nhiệm |
| --- | --- |
| Web | Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Axios và Lucide. |
| API | ASP.NET Core trên .NET 10, REST JSON dưới `/api/v1`, health check, xác thực, chống CSRF, hạn mức và lỗi. |
| Application | MediatR xử lý command/query theo phân hệ, FluentValidation và DataAnnotations. |
| Infrastructure | EF Core 10, SQL Server, phạm vi tổ chức, audit, migration và seed danh mục. InMemory dành cho Development/Testing được bật tường minh. |
| Kho tệp | Metadata SQL và PDF trong thư mục riêng. API kiểm quyền và chuyển dữ liệu qua luồng tải xuống. |
| CI | Locked restore, test, build, quét mã và secret, đối chiếu advisory, SBOM và Chromium. |

Trình duyệt dùng cookie phiên HttpOnly cùng origin. ASP.NET Core đối chiếu phiên đang hiệu lực, vai trò và đơn vị. API ghi cần CSRF token. Mật khẩu, mã kích hoạt và OTP sai trong luồng đăng nhập dùng chung bộ đếm SQL. Năm lần sai liên tiếp khóa đăng nhập 10 phút theo UTC. Cấu hình SQL tách principal phục vụ API và principal chạy migration. [Kiến trúc xác thực](AUTHENTICATION.md) · [Kiểm duyệt bảo mật](security-audit/SECURITY_AUDIT.md)

## Phân hệ và API

| Route web | Endpoint tương ứng | Hành vi chính |
| --- | --- | --- |
| `/login`, `/account-security` | `/auth/*` | Lần đầu gửi mật khẩu và mã kích hoạt cùng lúc, rồi quét QR và nhập OTP. Các lần sau dùng mật khẩu và OTP. Đổi mật khẩu và khôi phục Authenticator là các thao tác riêng. |
| `/`, `/organizations` | `/union-units/tree`, `/union-units/stats` | Thống kê trong phạm vi quản lý, cây phân cấp và quản lý đơn vị. |
| `/members`, `/members/[id]` | `/union-members`, `/union-members/{id}/transfer` | Tìm kiếm, phân trang, chỉnh hồ sơ, ngoại ngữ và 50 biến động mới nhất trong phạm vi. |
| `/activities`, `/finance`, `/welfare`, `/initiatives`, `/emulations` | Endpoint cùng tên | Danh sách, bộ lọc và thao tác nghiệp vụ theo quyền. |
| `/quality` | `GET /emulations/summary?nam=2026` | Hồ sơ theo năm, trạng thái và xếp loại đã được đánh giá. |
| `/catalogs`, `/accounts` | `/catalogs`, `/management-blocks`, `/accounts` | Danh mục, khối quản lý, khóa và mở khóa có xác thực, cấp mã kích hoạt, Reset mật khẩu và Reset 2FA. |
| Biểu mẫu minh chứng | `/evidence-files/*` | Tải lên PDF, liên kết bản ghi và tải xuống theo quyền. |

Các endpoint trong bảng dùng tiền tố `/api/v1`. Danh sách thường trả `data` và `hasMore`. Đoàn viên trả `data.items`, `totalCount`, `page` và `pageSize`. Tài chính bổ sung `totals.receipt` và `totals.expense` theo bộ lọc và quyền trước phân trang. Lỗi thông thường có `message`, `status` và `traceId`.

## Quyền thực thi

| Vai trò | Truy cập hiện hành |
| --- | --- |
| ADMIN | Tài khoản, danh mục, quản lý tổ chức và đoàn viên, đọc hoạt động. |
| CDCS | Nghiệp vụ toàn viện, quản lý tổ chức, hồ sơ, duyệt cuối và xem danh mục. |
| CDBP | Đơn vị gốc và tổ con đang hoạt động. Chuyển sinh hoạt khi cả hai đầu nằm trong phạm vi. |
| TOCD | Tổ của tài khoản. Hồ sơ và nghiệp vụ thuộc tổ. Tài chính giới hạn thu đoàn phí. |

Quyền viết, xóa, duyệt và phạm vi được kiểm tra ở backend. Chỉ ADMIN có ID đã cấu hình cho `qlcd_admin` được Reset mật khẩu và Reset 2FA cho tài khoản khác. Mở khóa có xác thực là thao tác ADMIN riêng và có thể đưa chính đơn vị liên kết trở lại cây khi đơn vị cha đang hoạt động. Hồ sơ cá nhân tự phục vụ cần liên kết tài khoản với đoàn viên và ma trận được duyệt. [Khôi phục tài khoản](ACCOUNT_RECOVERY.md) · [Quyền trong mã](../backend/QLCD.Domain/Security/SecurityRoles.cs)

## Dữ liệu và vận hành

Quan hệ chính gồm đơn vị cha–con, đoàn viên–tổ, ngoại ngữ và biến động theo đoàn viên, tài khoản–đơn vị, phiên–tài khoản. Tệp liên kết đối tượng nghiệp vụ qua module, ID và phạm vi. EF dùng khóa GUID, global filter soft delete và unique index cho CCCD/CMTQĐ, mã nhân viên, tài khoản và danh mục theo loại. Hồ sơ và biến động mới lưu trong cùng SaveChanges. Concurrency token từ chối lệnh ghi dùng các thuộc tính phạm vi hoặc trạng thái đã thay đổi. Audit ghi định danh, hành động và trace cho đăng nhập hoàn tất, đọc hồ sơ chi tiết và tải minh chứng hợp lệ. [EF model](../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs) · [Bảo vệ dữ liệu](security-audit/DATA_PROTECTION.md)

Production cần cùng origin HTTPS, TLS SQL với xác thực chứng thư, ổ tệp riêng, ClamAV, key ring được bảo vệ, MFA và backup đồng bộ. Migration hardening yêu cầu diễn tập và kế hoạch cấp lại mật khẩu. Khi cutover gặp lỗi, giữ chế độ bảo trì, triển khai bản vá tiến hoặc phục hồi vào bản sao cô lập. [Runbook triển khai và rollback](security-audit/08-remediation-status.md)

Xác minh quyền sử dụng MediatR 14.1.0 cho môi trường đích. Nếu tổ chức đã có khóa phù hợp, cung cấp `MediatR__LicenseKey` qua kho bí mật của backend. [Hướng dẫn cấu hình MediatR](https://github.com/LuckyPennySoftware/MediatR#setting-the-license-key)

## Khối quản lý của đơn vị

Nguồn chuẩn là KhoiChuyenMons, liên kết bởi DonViCongDoans.MaKhoi. Trang Danh mục gốc có nhóm Khối quản lý dùng API `/api/v1/management-blocks` (GET cho staff, POST/PUT chỉ ADMIN). Cây tổ chức giữ cấu trúc cha–con và hiển thị nhóm theo khối trong từng cấp; khối không tham gia OrganizationScopeService hoặc xác thực tài khoản. Dữ liệu chưa phân loại được hiển thị riêng, không tự gán. Các thao tác ngừng/khôi phục đơn vị giữ FK và độc lập với trạng thái sử dụng khối.

`MaKhoi` bắt buộc khi tạo đơn vị và cho phép null ở SQL để giữ dữ liệu cũ. Quản trị viên bổ sung phân loại thủ công trong **Sửa đơn vị**. Danh mục chung loại `KhoiChuyenMon` cũ chỉ đọc. Liên kết vẫn hiển thị nhãn của khối đã ngừng dùng. [Vận hành khối quản lý](SECURITY.md#nâng-schema-khối-quản-lý)
