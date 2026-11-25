# 04 · Threat model và STRIDE

## Tài sản và tác nhân

| Tài sản | Nội dung và tác động | Chủ thể liên quan |
| --- | --- | --- |
| Danh tính, JWT, bí mật SQL | Mật khẩu/hash, khóa ký, trạng thái tài khoản, role và org. Suy giảm tính toàn vẹn danh tính đưa các kiểm soát dữ liệu phía sau vào rủi ro. | Người dùng, ADMIN, DBA, vận hành. [LoginCommand.cs:40–68](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L68) · [TaiKhoan.cs:7–16](../../backend/QLCD.Domain/Entities/TaiKhoan.cs#L7-L16) · [appsettings.json:2–4](../../backend/QLCD.Api/appsettings.json#L2-L4) |
| Hồ sơ đoàn viên | CCCD, ngày sinh, liên hệ, dân tộc, tôn giáo, chức vụ và lịch sử chuyển. Nhu cầu giới hạn cả theo đơn vị và theo trường. | Đoàn viên, tổ trưởng, quản lý CĐBP/CĐCS, cán bộ phụ trách dữ liệu. [GetUnionMemberDetailQuery.cs:90–118](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMemberDetail/GetUnionMemberDetailQuery.cs#L90-L118) · [TransferUnionMemberCommand.cs:88–104](../../backend/QLCD.Application/Features/UnionMembers/Commands/TransferUnionMember/TransferUnionMemberCommand.cs#L88-L104) |
| Tài chính, phúc lợi, thi đua | Thu/chi, người liên quan, hỗ trợ và lý do, nội dung duyệt. Lý do hỗ trợ và tệp có thể phản ánh sức khỏe hoặc tình trạng gia đình. | Bộ phận tài chính, người đề xuất, người phê duyệt và kiểm toán. [GetFinanceQuery.cs:114–131](../../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs#L114-L131) · [GetWelfareQuery.cs:113–131](../../backend/QLCD.Application/Features/Welfare/Queries/GetWelfare/GetWelfareQuery.cs#L113-L131) · [EmulationCommands.cs:180–190](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L180-L190) |
| Minh chứng | Bytes PDF, tên gốc, liên kết nghiệp vụ, phạm vi và người tải lên. Backup file cần có quan hệ với thời điểm DB. | Người tải, người đọc, quản trị storage và hệ thống quét. [EvidenceFile.cs:8–18](../../backend/QLCD.Domain/Entities/EvidenceFile.cs#L8-L18) · [EvidenceFilesController.cs:79–96](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L79-L96) |
| Audit, artifact và khả dụng | Nhật ký, artifact phát hành, schema, bảng danh mục, dịch vụ SQL và ổ đĩa. Audit chứa bản sao trường nhạy cảm và cần kiểm soát riêng. | Vận hành, CI, DBA, người có repo/artifact, nhóm ứng phó. [AuditLogInterceptor.cs:48–84](../../backend/QLCD.Infrastructure/Interceptors/AuditLogInterceptor.cs#L48-L84) · [AuditLogInterceptor.cs:103–114](../../backend/QLCD.Infrastructure/Interceptors/AuditLogInterceptor.cs#L103-L114) · [Program.cs:79–99](../../backend/QLCD.Api/Program.cs#L79-L99) |

Tác nhân xem xét gồm người chưa đăng nhập, người có phiên hợp lệ với quyền hạn chế, quản trị viên, người có quyền đọc mã/artifact, người có quyền đọc DB/log/backup và sự cố vô tình từ vận hành. Role seed ghi nhận ADMIN/CDCS/CDBP/TOCD, còn vai trò đoàn viên là yêu cầu nghiệp vụ cần xác nhận được cấp ở runtime. [Ma trận kiến trúc](02-architecture-review.md#quyền-dữ-liệu-và-giới-hạn-chức-năng)

## DFD hiện tại

~~~mermaid
flowchart LR
  subgraph B1["B1 · Trình duyệt và bên ngoài ứng dụng"]
    Anonymous["Người chưa đăng nhập"]
    User["Người dùng hoặc quản trị"]
    Client["Next UI và Axios"]
    WebStore[("S1 · Web Storage")]
    User --> Client
    Client <--> WebStore
  end
  subgraph B2["B2 · Biên xác thực và ứng dụng"]
    SignIn["P1 · Login và phát JWT"]
    Auth["P2 · Xác thực JWT, vai trò và scope"]
    Command["P3 · API nghiệp vụ JSON"]
    Files["P4 · API minh chứng multipart"]
    Changes["P5 · EF SaveChanges và audit"]
    Boot["P6 · Bootstrap và lựa chọn provider"]
    Auth --> Command
    Auth --> Files
    Command -->|"Gắn metadata minh chứng"| Changes
    Files -->|"Insert và soft delete metadata"| Changes
  end
  subgraph B3["B3 · Hệ thống dữ liệu"]
    SQL[("S2 · SQL Server: nghiệp vụ, tài khoản, metadata, audit")]
    Mem[("S3 · InMemory khi fallback")]
  end
  subgraph B4["B4 · Quyền filesystem của API"]
    Disk[("S4 · Bytes PDF cục bộ")]
  end
  subgraph B5["B5 · Cấu hình và vòng đời phát hành"]
    Config["Mã cấu hình, artifact và migrations"]
  end
  Anonymous -->|"F1 · Credential đăng nhập"| SignIn
  Client <-->|"F1 · Credential, JWT và profile"| SignIn
  Client <-->|"F2 · Bearer, ID, dữ liệu JSON"| Auth
  Client <-->|"F3 · Multipart và download; GET qua scope thủ công"| Files
  SignIn <-->|"F1 · Tài khoản active, hash, role và org"| SQL
  Auth -->|"F2 · Tra quan hệ đơn vị"| SQL
  Command <-->|"F2 · Truy vấn có scope"| SQL
  Files <-->|"F3 · Metadata và đường lưu"| SQL
  Files <-->|"F3 · Ghi hoặc trả bytes"| Disk
  Changes -->|"F4 · Bản ghi và giá trị audit"| SQL
  Config -->|"F5 · Cấu hình và migrations"| Boot
  Boot -->|"Migration và seed"| SQL
  Boot -->|"Fallback và seed"| Mem
  Changes -->|"Khi provider in-memory"| Mem
  SignIn -.->|"Khi provider in-memory"| Mem
~~~

Các cạnh SQL biểu diễn provider chính và nhiều lượt truy cập qua EF. B3 là ranh giới quyền service account và dữ liệu, B4 là quyền hệ điều hành, B5 là ranh giới build/restore/migration. Download được vẽ trực tiếp từ client vì action có AllowAnonymous và tự áp scope ở bên trong. [Program.cs:19–39](../../backend/QLCD.Api/Program.cs#L19-L39) · [Program.cs:63–99](../../backend/QLCD.Api/Program.cs#L63-L99) · [DependencyInjection.cs:19–65](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L19-L65) · [EvidenceFilesController.cs:117–143](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L117-L143)

| Luồng | Kiểm soát đang có | Điểm cần bảo vệ |
| --- | --- | --- |
| F1 Credential → login → JWT | Tài khoản active, thông báo thất bại chung, chữ ký bearer. | Khóa theo môi trường, nơi lưu mật khẩu/hash, giới hạn thử, MFA và revoke. [SEC-001](03-security-findings.md#sec-001) · [SEC-002](03-security-findings.md#sec-002) · [SEC-011](03-security-findings.md#sec-011) |
| F2 JWT/JSON → API → SQL | Role gates ở nhóm quản trị, LINQ với DTO và scope theo đơn vị trên nhiều path, FK và unique. | Từ chối mặc định, policy theo hành động, scope theo đối tượng và khóa chéo tham chiếu chính tắc. [SEC-006](03-security-findings.md#sec-006) · [SEC-007](03-security-findings.md#sec-007) |
| F3 Multipart → disk + metadata → download | Giới hạn request, phần mở rộng, tên ngẫu nhiên, kiểm tra org, soft delete. | Không tin module/path/quan hệ tệp, xác minh PDF, private storage, audit read, đồng bộ và thu hồi. [SEC-005](03-security-findings.md#sec-005) · [SEC-008](03-security-findings.md#sec-008) · [SEC-015](03-security-findings.md#sec-015) |
| F4 EF → audit | Interceptor ghi trước SaveChanges. | Ít trường, actor thực, kết quả và tương quan. Kiểm soát truy cập log và thu hồi dữ liệu cũ. [SEC-010](03-security-findings.md#sec-010) |
| F5 Config/artifact → runtime | Swagger chỉ Development, config provider, EF migrations. | Xoay secret, ràng buộc runtime/lock, cấp quyền DDL riêng, readiness và khôi phục dữ liệu. [SEC-003](03-security-findings.md#sec-003) · [SEC-009](03-security-findings.md#sec-009) · [SEC-012](03-security-findings.md#sec-012) |

## STRIDE

| Loại | Tình huống có thể xảy ra | Kiểm soát hiện tại | Khoảng trống cần xử lý |
| --- | --- | --- | --- |
| S · Spoofing | Danh tính đặc quyền mất độ tin cậy khi vật liệu ký bị lộ hoặc khi dùng credential bootstrap. | JWT bearer, xác minh hash và trạng thái khi login. | Xoay khóa, một lần kích hoạt, MFA ở đặc quyền, kiểm trạng thái phiên. [SEC-001](03-security-findings.md#sec-001) · [SEC-004](03-security-findings.md#sec-004) · [SEC-011](03-security-findings.md#sec-011) |
| T · Tampering | Tệp đổi liên kết, bản ghi tài chính/thành tích có tham chiếu đơn vị không tương thích, hoặc đổi đơn vị bỏ qua lịch sử. | Scope trên bản ghi và FK, transaction trong chuyển với SQL. | Kiểm tài nguyên tệp và tham chiếu ở mọi thao tác, state machine, transaction và kiểm đồng thời. [SEC-005](03-security-findings.md#sec-005) · [SEC-006](03-security-findings.md#sec-006) · [SEC-007](03-security-findings.md#sec-007) |
| R · Repudiation | Khó quy trách nhiệm cho reset, xóa, tải hồ sơ hoặc đổi quan hệ tệp. | Audit EF ghi thay đổi. | Ghi actor xác thực, correlation ID, sự kiện read/deny và giới hạn truy cập audit. [SEC-010](03-security-findings.md#sec-010) |
| I · Information disclosure | Mật khẩu qua API admin, audit có snapshot PII, lỗi trả chi tiết nội bộ, scope thiếu claim mở rộng. | Role gate, soft delete, DTO. | Dropping plaintext an toàn, redaction, hợp đồng 401/403/404, rule thiếu claim và tối thiểu trường. [SEC-002](03-security-findings.md#sec-002) · [SEC-018](03-security-findings.md#sec-018) · [SEC-023](03-security-findings.md#sec-023) |
| D · Denial of service | SQL gián đoạn khiến dữ liệu không bền, tệp/quota và query lớn tăng tài nguyên, dependency có advisory runtime. | Giới hạn mỗi file, client dùng query page ở một số màn hình. | Readiness, quota toàn hệ thống, giới hạn truy vấn, canary và giám sát. [SEC-009](03-security-findings.md#sec-009) · [SEC-012](03-security-findings.md#sec-012) · [SEC-015](03-security-findings.md#sec-015) · [SEC-017](03-security-findings.md#sec-017) |
| E · Elevation of privilege | Tổng hợp role và org không đủ để hạn chế tác vụ duyệt, quản trị hoặc dữ liệu tự thân. | ADMIN cho accounts; ADMIN/CDCS cho ghi tổ chức, giới hạn ở transfer. | Policy hành động, xác thực role hữu hạn, phân biệt quản trị nền tảng/nghiệp vụ và bộ fixture đa đơn vị. [SEC-006](03-security-findings.md#sec-006) · [SEC-007](03-security-findings.md#sec-007) |

Thứ tự ưu tiên đe dọa theo diện ảnh hưởng là danh tính và credential, sau đó quyền nghiệp vụ/phạm vi dữ liệu, tiếp theo tính toàn vẹn kho và khả năng truy vết. Khi tiếp nhận sơ đồ triển khai, bổ sung actor hệ thống CI/cloud, trust của ingress và recovery. Kiểm chứng riêng ai truy cập bản sao DB, audit, PDF và có quyền khôi phục. [Kế hoạch](06-remediation-roadmap.md)
