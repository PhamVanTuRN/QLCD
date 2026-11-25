# 07 · Checklist kiểm tra và nghiệm thu

Các ô chưa đánh dấu là việc cần bằng chứng sau khắc phục hoặc xác minh triển khai. Dùng fixture tổng hợp gồm ít nhất hai đơn vị, vai trò ADMIN/CDCS/CDBP/TOCD và quyền tự thân nếu có trong thiết kế. Mỗi kết quả lưu commit, artifact, môi trường, người thực hiện, ngày, trạng thái và link đến log đã redaction. Các kiểm tra này thuộc giai đoạn triển khai được phê duyệt.

## Xác thực và phân quyền

- [ ] JWT key có nguồn riêng theo môi trường. Issuer/audience/algorithm/lifetime được validate, khóa cũ và phiên trước xoay hết hiệu lực. [SEC-001](03-security-findings.md#sec-001)
- [ ] Login có giới hạn theo tài khoản và nguồn, thông báo thất bại không phân biệt tài khoản, MFA/rescue flow cho privileged role. Thử kết quả 429 theo giới hạn cấu hình trong fixture. [SEC-014](03-security-findings.md#sec-014)
- [ ] Logout, reset, disable và đổi vai trò có hiệu lực trong SLA. Refresh rotation/reuse được chặn theo hợp đồng. Nếu có cookie, kiểm HttpOnly, Secure, SameSite và CSRF cho ghi. [SEC-011](03-security-findings.md#sec-011)
- [ ] Bỏ mật khẩu nguyên văn khỏi reset/seed/provisioning, schema đích, API, UI, audit và bản sao theo retention. KDF thích nghi dùng salt và version. Account demo đã được loại theo kiểm kê. [SEC-002](03-security-findings.md#sec-002) · [SEC-004](03-security-findings.md#sec-004) · [SEC-024](03-security-findings.md#sec-024)
- [ ] Route matrix cho toàn bộ API được duyệt bởi chủ nghiệp vụ. Kiểm anonymous, user hợp lệ nhưng sai role, role lạ, thiếu claim, resource cùng/khác đơn vị, và self vs người khác. Các endpoint read-only không ghi dữ liệu. [Bản đồ API](01-codebase-overview.md#bề-mặt-api-tại-snapshot) · [SEC-006](03-security-findings.md#sec-006) · [SEC-023](03-security-findings.md#sec-023)
- [ ] Tạo/sửa/xóa/chuyển/duyệt đi vào policy riêng; cập nhật hồ sơ không đổi đơn vị ngoài workflow. Tham chiếu tài chính/thi đua nhất quán với quyền của tất cả đối tượng liên quan. [SEC-006](03-security-findings.md#sec-006) · [SEC-007](03-security-findings.md#sec-007)

## API, input và tệp

- [ ] ASP.NET validators được thực thi cả ở API và khi handler được gọi qua mediator. Reject enum/GUID/range/batch/chuỗi sai trước khi ghi. Test HTTP response 400 định dạng ổn định và retry không tạo trùng. [SEC-020](03-security-findings.md#sec-020)
- [ ] Pagination, request size, timeout, throttle, filter/time range và budget SQL có giới hạn. Kiểm hợp đồng /v1 và độ trễ p95 bằng dataset tổng hợp. [SEC-017](03-security-findings.md#sec-017)
- [ ] Giữ LINQ hoặc tham số hóa khi thêm truy vấn, validate URL theo chính sách, áp CSP/nosniff, review điểm render không tin cậy, outbound requests, deserialization và CSRF theo cơ chế auth đích. [Kiểm tra injection](03-security-findings.md#giới-hạn-bằng-chứng-cho-các-nhóm-injection) · [SEC-019](03-security-findings.md#sec-019)
- [ ] 4xx/5xx và SQL/IO lỗi có mã ổn định và correlation ID. Body không lộ chi tiết exception, password, token hoặc PII. [SEC-018](03-security-findings.md#sec-018)
- [ ] Upload xác minh PDF, giới hạn kích thước và quota, dùng trạng thái quarantine/pending. Storage resolver chấp nhận module hữu hạn và chỉ đọc/ghi trong root riêng tư theo quyền tối thiểu. [SEC-008](03-security-findings.md#sec-008) · [SEC-015](03-security-findings.md#sec-015)
- [ ] Gắn minh chứng yêu cầu đúng owner/org/module và pending, thực hiện nguyên tử cùng bản ghi nghiệp vụ. Retry, concurrent attachment và lỗi lưu được xử lý. Tệp đã gắn và bản ghi khác đơn vị giữ nguyên khi bị từ chối. [SEC-005](03-security-findings.md#sec-005)
- [ ] Download/delete thực thi policy, không đưa token vào URL, xác thực bắt buộc, không phân biệt tài nguyên bị che với tài nguyên thiếu. UI hỗ trợ download qua kênh xác thực. Nếu có signed URL, kiểm expiration và scope đúng tệp. [SEC-016](03-security-findings.md#sec-016)
- [ ] Xóa logic, legal hold, cleanup và xóa vật lý có tiêu chí; SQL và bytes đối soát được sau khôi phục. Storage không được phân phối trực tiếp bởi frontend/reverse proxy. [SEC-015](03-security-findings.md#sec-015) · [SEC-021](03-security-findings.md#sec-021)

## Triển khai, dữ liệu và phục hồi

- [ ] Owner vận hành cung cấp topology, ingress/reverse proxy và cấu hình TLS, dải mạng tin cậy, DNS và ACL đã che bí mật. Xác nhận API/SQL không mở ngoài nhu cầu. Redirect/HSTS/CORS/headers hiệu lực trên response thực, Swagger/debug tắt production. [SEC-013](03-security-findings.md#sec-013)
- [ ] Nếu có container/Kubernetes, kiểm user non-root, quyền filesystem, network policy, secret mounts, image provenance, probe và quyền vận hành trên manifest/build thực. Repo snapshot thiếu các artifact đó. [Kiểm kê](01-codebase-overview.md#kiểm-kê-triển-khai)
- [ ] Credential DB được xoay, SQL TLS kiểm chứng chứng thư, quyền runtime chỉ DML/procedure cần thiết và audit có phân quyền trực tiếp. Quyền DDL/migration theo job tách. [SEC-003](03-security-findings.md#sec-003)
- [ ] Runtime không fallback InMemory. SQL hỏng làm readiness fail, API trả kết quả an toàn và không seed/Migrate ở tiến trình phục vụ. [SEC-009](03-security-findings.md#sec-009)
- [ ] Nội dung phúc lợi/hồ sơ/tệp có phân loại PII, danh sách trường trả theo mục đích, ACL tối thiểu và kiểm truy vấn chéo. Áp mã hóa disk/backup, quản lý khóa và retention theo chính sách được duyệt. [SEC-006](03-security-findings.md#sec-006) · [SEC-021](03-security-findings.md#sec-021)
- [ ] Backup + restore đồng bộ SQL/metadata/bytes có minh chứng RPO/RTO và rollback, bao gồm luân chuyển quyền, tính toàn vẹn, quyền phục hồi và dữ liệu bị giữ do legal hold. [SEC-021](03-security-findings.md#sec-021)

## Logging, dependency và release

- [ ] Login, deny, revoke, thay đổi quyền và account, đọc hồ sơ/tệp nhạy cảm, ghi/xóa/duyệt có log UTC, actor, action, target, outcome và trace ID. Kiểm sink không có secret, hash, CCCD đầy đủ hoặc log injection từ input. [SEC-010](03-security-findings.md#sec-010)
- [ ] Audit role độc lập, truy xuất có log, ít trường, chống sửa/xóa tùy tiện, có retention. Cảnh báo có người nhận và runbook login bất thường, 403 ngoài scope, quota, SQL readiness, lỗi file và advisory. [SEC-010](03-security-findings.md#sec-010) · [SEC-021](03-security-findings.md#sec-021)
- [ ] SBOM và versions giải từ artifact phát hành. Đối chiếu Next/sharp/native, Axios, SqlClient và runtime .NET với advisory/cycle, bỏ cảnh báo dependency mismatch hoặc lưu quyết định có thời hạn. npm/NuGet lock được kiểm ở CI. [SEC-012](03-security-findings.md#sec-012) · [SEC-022](03-security-findings.md#sec-022)
- [ ] Secret/SAST/SCA scan offline hoặc trong hạ tầng cho phép, fixture kiểm hồi quy API + SQL + storage, kiểm pipeline có quyền tối thiểu và phê duyệt production. Xác nhận không có mã hoặc dữ liệu nội bộ trong payload tới dịch vụ không được phê duyệt. [SEC-022](03-security-findings.md#sec-022)
- [ ] Báo cáo nghiệm thu ghi rủi ro còn lại, người chấp nhận và thời điểm xem lại. Diễn tập revoke, restore và rollback đã có biên bản. [Lộ trình](06-remediation-roadmap.md)

## Bằng chứng cần thu từ vận hành

| Cần thu | Bên giữ thông tin | Mục liên quan |
| --- | --- | --- |
| Artifact digest, SBOM, runtime/OS/architecture và audit reachability tính năng hình ảnh | Release/frontend/platform | SEC-012, SEC-022 |
| JWT/SQL secret lifecycle, lịch rotate và chứng chỉ chỉ ở dạng metadata đã lọc | IAM/vận hành/DBA | SEC-001, SEC-003, SEC-011 |
| Vai trò được cấp, số lượng account theo vai trò và trạng thái, không kèm PII | Chủ nghiệp vụ | SEC-004, SEC-006, SEC-023 |
| TLS/CORS/header/gateway ingress, network và quyền volume/runtime đã che thông tin | Platform | SEC-008, SEC-013, SEC-021 |
| Inventory dữ liệu/backup audit, encryption, retention, RPO/RTO và biên bản restore | DBA, quản trị dữ liệu, security | SEC-002, SEC-010, SEC-021 |
