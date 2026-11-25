# 06 · Lộ trình khắc phục

P0 là xử lý hoặc kiểm tra ngay theo phơi nhiễm, P1 là hardening, P2 là chuẩn hóa. Độ phức tạp định tính dựa trên số module, thay đổi dữ liệu và phối hợp triển khai. Mốc dưới đây là thứ tự triển khai đề xuất, phụ thuộc phê duyệt của chủ hệ thống và kết quả xác minh. Mọi phép thử dùng dữ liệu tổng hợp trong môi trường cô lập sau khi có thay đổi được duyệt.

## Giai đoạn 1 · Xử lý khẩn cấp

| STT | Vấn đề | Rủi ro | Giải pháp | File/module cần sửa | Độ phức tạp | Ưu tiên | Cách kiểm thử |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | [SEC-001](03-security-findings.md#sec-001) | Critical | Xoay JWT, hủy khóa cũ, cấu hình issuer/audience, đăng nhập lại đồng bộ FE/API | Program, LoginCommand, secret store, web auth | Vừa | P0 | Kiểm phiên mới, từ chối khóa cũ và issuer/audience sai theo hợp đồng |
| 02 | [SEC-002](03-security-findings.md#sec-002), [SEC-024](03-security-findings.md#sec-024) | Critical / High | Dừng trả/ghi plaintext, reset tài khoản ảnh hưởng, KDF có version, chuẩn bị cleanup và migration schema | Accounts, GetAccountsQuery, CreateUnionUnit, TaiKhoan, Shared, Audit, UI accounts | Cao | P0 | Provision/reset hợp lệ, response/log/backup mới không còn raw, hash có salt riêng |
| 03 | [SEC-003](03-security-findings.md#sec-003), [SEC-004](03-security-findings.md#sec-004) | High | Rotate DB, bootstrap riêng, quản lý phát hành một lần, disable tài khoản seed, kiểm kê artifact | appsettings, Infrastructure, DbInitializer, CreateUnionUnit, script scratch | Vừa | P0 | Credential cũ bị hủy, TLS SQL xác minh chứng thư, production clone chỉ cấp account đã duyệt |
| 04 | [SEC-005](03-security-findings.md#sec-005), [SEC-008](03-security-findings.md#sec-008) | High | Giới hạn scope tệp, root riêng, module allowlist; khóa chức năng file nếu chưa thể đối soát | EvidenceFilesController, 5 module, Transfer, storage | Cao | P0 | Quyền tệp nguồn và đích, module và storage root đúng, lỗi không ghi một phần |
| 05 | [SEC-006](03-security-findings.md#sec-006), [SEC-007](03-security-findings.md#sec-007) | High | Giới hạn tác vụ phê duyệt, gán org/đoàn viên, xóa/chuyển; chốt policy tối thiểu | UnionMembers, Finance, Emulations, Welfare, các controller và scope | Cao | P0 | Ma trận đọc/ghi đơn vị và vai trò, xác nhận quan hệ cùng đơn vị, ghi chuyển có lịch sử |
| 06 | [SEC-009](03-security-findings.md#sec-009) | High | Fail closed, bỏ fallback production, tách migration và readiness | Program, Infrastructure DI, SQL release job | Vừa–cao | P0 | SQL lỗi, lỗi schema hoặc mất readiness không chuyển in-memory và không bị gửi traffic |
| 07 | [SEC-010](03-security-findings.md#sec-010), [SEC-011](03-security-findings.md#sec-011) | High | Chặn ghi secret/PII vào audit ngay; cưỡng bức hủy phiên khi đợt reset/đổi khóa | AuditLogInterceptor, JwtBearer, Accounts | Vừa | P0 cho khoanh vùng | Sự kiện ghi mới được lọc; phiên trước đợt xử lý không còn hiệu lực |
| 08 | [SEC-012](03-security-findings.md#sec-012), [SEC-013](03-security-findings.md#sec-013) | High, gồm điều kiện triển khai | Kiểm môi trường và runtime, chặn tính năng ảnh không cần dùng, nhận bản vá, kiểm HTTPS/CORS | package lock, backend package refs, config và ingress | Vừa–cao | P0 | SBOM artifact xác nhận bản vá và thành phần native; browser truy cập đúng HTTPS; feature quan trọng hoạt động |

- **Phụ thuộc và điều kiện triển khai** — Có chủ nghiệp vụ, DBA, người quản trị secret và ingress. Xác nhận phiên bản artifact, phạm vi account, dữ liệu lịch sử và quyền thiết yếu. Lấy snapshot được kiểm soát, thử restore trước các bước schema bất thuận nghịch. Chạy canary theo thứ tự backend/FE tương thích và thông báo phiên bị hủy.
- **Rollback** — Dùng artifact đã sửa với schema tương thích hoặc chuyển sang chế độ bảo trì/đọc có giới hạn. Không kích hoạt lại khóa/credential đã phơi nhiễm, plaintext API, seed demo hoặc fallback production. Dùng forward fix hoặc khôi phục từ bản sao được cấp quyền nếu dữ liệu gặp sự cố.
- **Nghiệm thu** — Hai Critical đã đóng hoặc bề mặt đã cô lập có chủ trách nhiệm. Route nhạy cảm có fixture deny/allow. SQL readiness và các kiểm soát tạm thời có log/metric. Các mục advisory có bằng chứng hoặc biện pháp giảm phơi nhiễm theo artifact.

## Giai đoạn 2 · Hardening

| STT | Vấn đề | Rủi ro | Giải pháp | File/module cần sửa | Độ phức tạp | Ưu tiên | Cách kiểm thử |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 09 | [SEC-011](03-security-findings.md#sec-011), [SEC-014](03-security-findings.md#sec-014) | High / Medium | Session revoke/version, refresh rotation hoặc BFF, throttle và MFA | Program, Auth, Accounts, AuthProvider, ingress | Cao | P1 | Hủy phiên sau reset/disable/logout, ngưỡng 429, MFA/recovery cho admin và UI refresh |
| 10 | [SEC-017](03-security-findings.md#sec-017), [SEC-020](03-security-findings.md#sec-020) | Medium | Validation pipeline, page cap, projection/index, tính tổng ở SQL | Program, Application DI, query/validators, FE lists/dashboard | Vừa | P1 | Input giới hạn biên, kiểm số truy vấn, latency, pagination và aggregate theo scope |
| 11 | [SEC-010](03-security-findings.md#sec-010), [SEC-018](03-security-findings.md#sec-018) | High / Medium | Structured audit, actor/trace, ProblemDetails, redaction và playbook | AuditLogInterceptor, Controllers, Program, UI lỗi | Vừa | P1 | Actor thật, 4xx/5xx có trace ID, log đã lọc, cảnh báo test khớp điều kiện |
| 12 | [SEC-015](03-security-findings.md#sec-015), [SEC-016](03-security-findings.md#sec-016), [SEC-019](03-security-findings.md#sec-019) | Medium / Low | Quarantine/stream/quota, bảo vệ download, trạng thái lưu giữ và ID chứng chỉ | EvidenceFiles, FileStorage adapter, EvidenceUpload, member detail | Cao | P1; link P2 | Fixture PDF, không lộ tồn tại trước auth, link hợp lệ và quyền tải đúng sau chuyển |
| 13 | [SEC-021](03-security-findings.md#sec-021), [SEC-023](03-security-findings.md#sec-023) | Medium | Xác minh backup/TLS/encryption, kiểm quyền cây & báo cáo, giảm thiểu PII, retention | Scope, Tree/Stats, SQL, storage và ops | Vừa–cao | P1 | Thử org/role thiếu theo policy, biên bản restore có DB/file, ACL và quá hạn về đúng quy tắc |

- **Phụ thuộc và điều kiện triển khai** — Giai đoạn 1 đã ổn định, có SLA revoke, owner cho ma trận quyền, DB/PII classification, ngưỡng pagination/quota và nhóm pilot. Phát hành schema tương thích ngược và thay từng flow có test hồi quy.
- **Rollback** — Quay lại handler phiên bản đã harden với contract cũ khi phù hợp, duy trì policy tối thiểu và giới hạn tại ingress. Nếu audit pipeline lỗi, dùng hàng đợi nội bộ hoặc tạm hạn chế thao tác nhạy cảm theo quy trình. Không quay về ghi nguyên văn.
- **Nghiệm thu** — Kiểm thử session, quyền, data contract và lưu trữ đạt. Runbook nêu đáp ứng lỗi, người trực, alert và evidence theo môi trường.

## Giai đoạn 3 · Cải tiến kiến trúc

| STT | Vấn đề | Rủi ro | Giải pháp | File/module cần sửa | Độ phức tạp | Ưu tiên | Cách kiểm thử |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 14 | [SEC-005](03-security-findings.md#sec-005)–[SEC-008](03-security-findings.md#sec-008) | High | Chuẩn hóa policy, transactional workflows, phân vai dữ liệu và Application boundary | Application handlers, Scope, EF, Accounts/Evidence controllers | Cao | P2 sau biện pháp P0 | API contract smoke, cùng/cross-unit, concurrency, retry, đối chiếu dữ liệu trước/sau |
| 15 | [SEC-009](03-security-findings.md#sec-009), [SEC-015](03-security-findings.md#sec-015), [SEC-021](03-security-findings.md#sec-021) | High / Medium | Storage adapter riêng tư, đa replica, migration riêng, restore đồng bộ | Infrastructure, SQL schema/job, storage và observability | Cao | P2 | Đổi replica, đối soát metadata/bytes, restore trong RTO/RPO, kiểm quyền runtime không có DDL |
| 16 | [SEC-012](03-security-findings.md#sec-012), [SEC-022](03-security-findings.md#sec-022) | High / Medium | Baseline .NET 10 LTS và runtime Node tương thích, khóa package xác định, SBOM và proof phát hành | .sln, csproj, package/lock, pipelines được phê duyệt | Cao | P1 cho runtime hỗ trợ, P2 tối ưu | Build clean reproducible, test SQL/JWT/OpenAPI, kiểm phiên bản artifact và smoke canary |

- **Phụ thuộc và điều kiện triển khai** — Có kiến trúc mục tiêu, đầy đủ regression fixtures, feature cutover plan, backup đã kiểm và các trường chuyển đổi. Stage dùng cấu hình riêng, egress và storage theo thiết kế production.
- **Rollback** — Expand/contract với cửa sổ đọc metadata/scheme cũ đã được bảo vệ. Giữ mapping ID/bytes có version và backup theo thời điểm. Rút traffic canary khi vượt ngưỡng, rollback artifact cùng schema được hỗ trợ.
- **Nghiệm thu** — Thay đổi giữ hợp đồng chức năng hợp lệ, đạt latency/load mục tiêu và hai replica hoạt động với kho thống nhất. Hỗ trợ runtime được chứng minh bằng SBOM và chính sách vòng đời.

## Giai đoạn 4 · Kiểm thử và giám sát

| STT | Vấn đề | Rủi ro | Giải pháp | File/module cần sửa | Độ phức tạp | Ưu tiên | Cách kiểm thử |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | [SEC-022](03-security-findings.md#sec-022) | Medium | Gate CI cho secret, SAST, SCA, SBOM và xUnit tích hợp SQL/API và frontend smoke | QLCD.Tests, CI/release, advisory mirror | Cao | P2, chạy gate tối thiểu sớm | Job chứng minh chặn hồi quy trên fixture, lock chỉ thay ở PR, không đưa mã/bí mật ra dịch vụ ngoài |
| 18 | [SEC-010](03-security-findings.md#sec-010), [SEC-012](03-security-findings.md#sec-012), [SEC-021](03-security-findings.md#sec-021) | High / Medium | SLA xử lý advisory, quan sát phiên/403/quota, quy trình sự cố và restore định kỳ | Observability, backup/restore, runbook và báo cáo | Vừa | P2 | Mô phỏng alert và khôi phục với dữ liệu tổng hợp, gắn ticket/owner/SLA và biên bản |

- **Phụ thuộc và điều kiện triển khai** — CI có runner cô lập, định nghĩa rule/gate, có môi trường SQL thật cho test và artifact cần giám sát. Người nhận cảnh báo và owner ngoại lệ được xác định.
- **Rollback** — Điều chỉnh noisy rule có ngoại lệ hết hạn và phê duyệt. Giữ gate xác thực và quyền dữ liệu bắt buộc. Cảnh báo có kênh dự phòng khi collector lỗi.
- **Nghiệm thu** — Build xuất SBOM, kết quả test/scan ký nhận trên từng artifact, môi trường vận hành có báo cáo xu hướng và định kỳ diễn tập restore/revoke/rollback. [Checklist](07-security-checklist.md)
