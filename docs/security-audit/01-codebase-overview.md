# 01 · Tổng quan codebase QLCD

Ngày đánh giá 23/11/2026, múi giờ Asia/Bangkok. Phạm vi là working tree của nhánh `main` trên commit nền `b9e38b2`, gồm thay đổi chưa commit đang có trong backend/frontend, dịch vụ scope và phần minh chứng mới. Các dòng dẫn chiếu thuộc snapshot này. Các tài liệu nghiệp vụ cung cấp đối chiếu quyền, còn hành vi ứng dụng được suy ra từ mã.

## Công nghệ và thành phần

| Thành phần | Phiên bản quan sát và trách nhiệm | Bằng chứng |
| --- | --- | --- |
| API | C#, ASP.NET Core controllers, mục tiêu .NET 8. JwtBearer 8.0.0, Swashbuckle 10.2.2. Khởi tạo pipeline, bind JSON/multipart và expose API /v1. Phiên bản runtime production chưa biết | [QLCD.Api.csproj:3–23](../../backend/QLCD.Api/QLCD.Api.csproj#L3-L23) · [Program.cs:15–77](../../backend/QLCD.Api/Program.cs#L15-L77) |
| Application | MediatR 14.1.0 cho command/query, FluentValidation 12.1.1, EF Core 8.0.0, thư viện IdentityModel/JWT 8.14.0. Có tham chiếu AutoMapper 16.1.1 và extension DI 12.0.1 | [QLCD.Application.csproj:3–20](../../backend/QLCD.Application/QLCD.Application.csproj#L3-L20) · [DependencyInjection.cs:9–21](../../backend/QLCD.Application/DependencyInjection.cs#L9-L21) |
| Domain và Shared | Entity cho tổ chức, đoàn viên, nghiệp vụ, tài khoản, audit và minh chứng. BaseEntity và phân loại bằng enum. Shared có password hasher đang được login dùng | [QLCDDbContext.cs:17–32](../../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs#L17-L32) · [BaseEntity.cs:5–13](../../backend/QLCD.Domain/Common/BaseEntity.cs#L5-L13) · [LoginCommand.cs:9–13](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L9-L13) · [PasswordHasher.cs:7–19](../../backend/QLCD.Shared/Security/PasswordHasher.cs#L7-L19) |
| Infrastructure | EF Core 8.0.0, SQL Server, interceptor audit, migrations và seed. InMemory là provider fallback có thật. Không xác định phiên bản máy chủ SQL từ repo | [QLCD.Infrastructure.csproj:10–20](../../backend/QLCD.Infrastructure/QLCD.Infrastructure.csproj#L10-L20) · [DependencyInjection.cs:15–65](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L15-L65) · [Program.cs:79–99](../../backend/QLCD.Api/Program.cs#L79-L99) |
| Web | Next.js 16.2.9 App Router, React/React DOM 19.2.4, TypeScript 5.9.3, Tailwind 4.3.1, Axios 1.18.0 theo npm lockfile. Màn hình nghiệp vụ phía trình duyệt dùng Axios | [package.json:5–30](../../frontend/qlcd-web/package.json#L5-L30) · [package-lock.json:2646–2649](../../frontend/qlcd-web/package-lock.json#L2646-L2649) · [package-lock.json:5507–5510](../../frontend/qlcd-web/package-lock.json#L5507-L5510) · [package-lock.json:5974–5988](../../frontend/qlcd-web/package-lock.json#L5974-L5988) · [package-lock.json:6709–6712](../../frontend/qlcd-web/package-lock.json#L6709-L6712) · [package-lock.json:6933–6936](../../frontend/qlcd-web/package-lock.json#L6933-L6936) · [api.ts:1–24](../../frontend/qlcd-web/src/lib/api.ts#L1-L24) |
| Xác thực | Username/password trong TaiKhoan, phát JWT bearer có ID, vai trò, đơn vị. Web lưu token và profile trong browser, AppShell điều hướng theo trạng thái UI | [LoginCommand.cs:40–78](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L78) · [auth-context.tsx:24–45](../../frontend/qlcd-web/src/lib/auth-context.tsx#L24-L45) · [auth-context.tsx:65–96](../../frontend/qlcd-web/src/lib/auth-context.tsx#L65-L96) · [AppShell.tsx:9–28](../../frontend/qlcd-web/src/components/AppShell.tsx#L9-L28) |
| File | Lưu bytes PDF ở ổ đĩa của API, bảng EvidenceFiles lưu metadata. Xóa logic. UI upload multipart và mở link trực tiếp | [EvidenceFilesController.cs:33–35](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L33-L35) · [EvidenceFilesController.cs:63–108](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L63-L108) · [EvidenceFilesController.cs:155–177](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L155-L177) · [EvidenceFile.cs:6–18](../../backend/QLCD.Domain/Entities/EvidenceFile.cs#L6-L18) · [EvidenceUpload.tsx:129–136](../../frontend/qlcd-web/src/components/EvidenceUpload.tsx#L129-L136) |
| Test | xUnit, test nghiệp vụ trực tiếp trên EF InMemory | [QLCDTests.cs:18–27](../../backend/QLCD.Tests/QLCDTests.cs#L18-L27) · [QLCDTests.cs:44–65](../../backend/QLCD.Tests/QLCDTests.cs#L44-L65) · [QLCDTests.cs:167–192](../../backend/QLCD.Tests/QLCDTests.cs#L167-L192) |

Kiến trúc là **backend monolith phân lớp**, có tổ chức feature gần modular monolith và CQRS trong cùng tiến trình. API → Application/Infrastructure/Shared theo project references. Application → Domain/Shared, Infrastructure triển khai interface của Application. Các feature dùng chung DbContext và cùng schema SQL. Account reset/toggle và xử lý file đi thẳng từ controller vào context. Read/write chia qua handler nhưng chưa có data store tách riêng. [QLCD.Api.csproj:20–25](../../backend/QLCD.Api/QLCD.Api.csproj#L20-L25) · [QLCD.Application.csproj:3–16](../../backend/QLCD.Application/QLCD.Application.csproj#L3-L16) · [QLCD.Infrastructure.csproj:3–17](../../backend/QLCD.Infrastructure/QLCD.Infrastructure.csproj#L3-L17) · [IQLCDDbContext.cs:7–28](../../backend/QLCD.Application/Common/Interfaces/IQLCDDbContext.cs#L7-L28) · [AccountsController.cs:19–25](../../backend/QLCD.Api/Controllers/AccountsController.cs#L19-L25) · [EvidenceFilesController.cs:19–31](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L19-L31)

Frontend được đóng gói thành ứng dụng riêng, giao tiếp qua browser → API HTTP JSON/multipart. Không thấy Redis/cache phân tán, broker, SMTP, SSO/IdP, object storage hay API nghiệp vụ của bên thứ ba trên các đường xử lý đã rà. Next import Google Font qua `next/font/google`; điều này cho thấy phụ thuộc build/font, không cho thấy dữ liệu đoàn viên được gửi đến Google. Tích hợp ứng dụng thấy được là SQL Server và filesystem. [layout.tsx:1–21](../../frontend/qlcd-web/src/app/layout.tsx#L1-L21) · [next.config.ts:1–7](../../frontend/qlcd-web/next.config.ts#L1-L7) · [api.ts:1–24](../../frontend/qlcd-web/src/lib/api.ts#L1-L24) · [DependencyInjection.cs:47–65](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L47-L65)

## Kiến trúc hiện tại

~~~mermaid
flowchart LR
  subgraph WEB["Frontend Next.js"]
    Pages["App Router và các trang nghiệp vụ"]
    Shell["AppShell và AuthProvider"]
    Pages --> Shell
  end
  subgraph CLIENT["Máy người dùng"]
    Browser["Browser, Axios"]
    Local[("Web Storage: profile và JWT")]
    Browser <--> Local
  end
  subgraph BACK["Tiến trình ASP.NET Core"]
    Edge["CORS, JwtBearer, Authorization"]
    Ctrl["Controllers /api/v1"]
    MQ["MediatR command/query"]
    Rules["Scope và current user"]
    Context["EF Core DbContext"]
    Audit["AuditLogInterceptor"]
    Bootstrap["Migration và seed startup"]
    Edge --> Ctrl
    Ctrl --> MQ
    Ctrl -->|"Accounts và files"| Context
    MQ --> Rules
    MQ --> Context
    Rules --> Context
    Context --> Audit
    Bootstrap --> Context
  end
  subgraph STORES["Lưu trữ"]
    SQL[("SQL Server")]
    Mem[("EF InMemory")]
    PDF[("Thư mục PDF cục bộ")]
  end
  Shell -->|"UI và mã client"| Browser
  Browser -->|"HTTP API, JSON hoặc multipart"| Edge
  Context -->|"SQL cấu hình"| SQL
  Context -->|"Khi chọn fallback"| Mem
  Ctrl -->|"Ghi và đọc PDF"| PDF
~~~

Ranh giới tin cậy nằm ở browser → frontend/API, danh tính đã xác thực → policy chức năng và phạm vi đơn vị, API → SQL, API → filesystem và runtime → cấu hình khởi tạo. Reverse proxy, mạng SQL, volume và triển khai frontend có thể tạo ranh giới bổ sung. Cơ chế cụ thể cần đối chiếu artifact production. [DFD và STRIDE](04-threat-model.md)

## Bề mặt API tại snapshot

Mọi path trong bảng có tiền tố `/api/v1`. Số lượng gồm từng action theo HTTP method và route, tổng **42 action, 11 controller**.

| Nhóm | Route và thao tác | Kiểm soát hiện tại | Bằng chứng |
| --- | --- | --- | --- |
| Auth | POST /auth/login | Anonymous; lookup tài khoản active và verify mật khẩu | [AuthController.cs:9–35](../../backend/QLCD.Api/Controllers/AuthController.cs#L9-L35) · [LoginCommand.cs:40–49](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L49) |
| Accounts | GET /accounts, POST /accounts/{id}/toggle và /reset-password | ADMIN; DTO trả trường mật khẩu nguyên văn | [AccountsController.cs:14–88](../../backend/QLCD.Api/Controllers/AccountsController.cs#L14-L88) · [GetAccountsQuery.cs:35–51](../../backend/QLCD.Application/Features/Accounts/Queries/GetAccounts/GetAccountsQuery.cs#L35-L51) |
| Catalogs | GET/POST /catalogs, PUT/DELETE /catalogs/{id} | Bearer khi đọc, ADMIN khi ghi | [CatalogsController.cs:13–106](../../backend/QLCD.Api/Controllers/CatalogsController.cs#L13-L106) |
| Union members | GET/POST /union-members, GET/PUT/DELETE /union-members/{id}, POST /union-members/{id}/transfer | Bearer + kiểm tra scope. Lệnh chuyển chặn TOCD/DOANVIEN; PUT còn có đường đổi đơn vị | [UnionMembersController.cs:16–180](../../backend/QLCD.Api/Controllers/UnionMembersController.cs#L16-L180) · [TransferUnionMemberCommand.cs:33–70](../../backend/QLCD.Application/Features/UnionMembers/Commands/TransferUnionMember/TransferUnionMemberCommand.cs#L33-L70) · [UpdateUnionMemberCommand.cs:80–90](../../backend/QLCD.Application/Features/UnionMembers/Commands/UpdateUnionMember/UpdateUnionMemberCommand.cs#L80-L90) · [UpdateUnionMemberCommand.cs:126–142](../../backend/QLCD.Application/Features/UnionMembers/Commands/UpdateUnionMember/UpdateUnionMemberCommand.cs#L126-L142) |
| Union units | POST /union-units, GET /union-units/tree và /stats, PUT/DELETE /union-units/{id} | Bearer khi đọc, ADMIN/CDCS khi ghi. Tree/stats dùng logic scope riêng | [UnionUnitsController.cs:15–120](../../backend/QLCD.Api/Controllers/UnionUnitsController.cs#L15-L120) · [GetUnionUnitsTreeQuery.cs:116–129](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionUnitsTree/GetUnionUnitsTreeQuery.cs#L116-L129) · [GetUnionStatsQuery.cs:79–116](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionStats/GetUnionStatsQuery.cs#L79-L116) |
| Activities | GET/POST /activities, PUT/DELETE /activities/{id} | Bearer + scope trong handler | [ActivitiesController.cs:12–136](../../backend/QLCD.Api/Controllers/ActivitiesController.cs#L12-L136) · [ActivityCommands.cs:39–48](../../backend/QLCD.Application/Features/Activities/Commands/ActivityCommands.cs#L39-L48) |
| Finance | GET/POST /finance, PUT/DELETE /finance/{id} | Bearer + scope đơn vị giao dịch | [FinanceController.cs:12–135](../../backend/QLCD.Api/Controllers/FinanceController.cs#L12-L135) · [FinanceCommands.cs:40–59](../../backend/QLCD.Application/Features/Finance/Commands/FinanceCommands.cs#L40-L59) |
| Welfare | GET/POST /welfare, PUT/DELETE /welfare/{id} | Bearer + scope từ đoàn viên hoặc bản ghi | [WelfareController.cs:12–135](../../backend/QLCD.Api/Controllers/WelfareController.cs#L12-L135) · [WelfareCommands.cs:39–66](../../backend/QLCD.Application/Features/Welfare/Commands/WelfareCommands.cs#L39-L66) |
| Initiatives | GET/POST /initiatives, PUT/DELETE /initiatives/{id} | Bearer + scope từ đoàn viên hoặc bản ghi | [InitiativesController.cs:12–135](../../backend/QLCD.Api/Controllers/InitiativesController.cs#L12-L135) · [InitiativeCommands.cs:42–71](../../backend/QLCD.Application/Features/Initiatives/Commands/InitiativeCommands.cs#L42-L71) |
| Emulations | GET/POST /emulations, PUT/DELETE /emulations/{id} | Bearer + scope tính khác nhau giữa đọc và ghi | [EmulationsController.cs:12–135](../../backend/QLCD.Api/Controllers/EmulationsController.cs#L12-L135) · [EmulationCommands.cs:41–79](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L41-L79) · [GetEmulationsQuery.cs:61–72](../../backend/QLCD.Application/Features/Emulations/Queries/GetEmulations/GetEmulationsQuery.cs#L61-L72) |
| Evidence files | POST /evidence-files/upload, GET /evidence-files/download/{id}, DELETE /evidence-files/{id} | Bearer và scope cho upload/delete. Download dùng AllowAnonymous rồi kiểm scope thủ công | [EvidenceFilesController.cs:14–16](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L14-L16) · [EvidenceFilesController.cs:33–61](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L33-L61) · [EvidenceFilesController.cs:117–175](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L117-L175) |

Frontend có login, dashboard, accounts, catalogs, organizations, danh sách/chi tiết thành viên, quality và năm module nghiệp vụ. Không thấy route handler Next riêng dùng làm BFF trong `src/app`. Bề mặt bổ sung gồm Swagger chỉ ở Development, file `.http` để gọi API từ máy phát triển và script scratch chẩn đoán được theo dõi. Môi trường Development phơi ra ngoài cần được xác minh. [Program.cs:63–77](../../backend/QLCD.Api/Program.cs#L63-L77) · [QLCD.Api.http:1–6](../../backend/QLCD.Api/QLCD.Api.http#L1-L6) · [test_db.py:29–50](../../frontend/qlcd-web/scratch/test_db.py#L29-L50)

## Kiểm kê triển khai

- Các cấu hình có thể đối chiếu gồm appsettings thường, appsettings Development, launch profiles, Next config, npm lockfile, project files và EF migrations. Cấu hình launch mô tả môi trường phát triển. [appsettings.Development.json:2–7](../../backend/QLCD.Api/appsettings.Development.json#L2-L7) · [launchSettings.json:12–30](../../backend/QLCD.Api/Properties/launchSettings.json#L12-L30) · [next.config.ts:1–7](../../frontend/qlcd-web/next.config.ts#L1-L7) · [20260621222853_AddEvidenceFiles.cs:13–35](../../backend/QLCD.Infrastructure/Migrations/20260621222853_AddEvidenceFiles.cs#L13-L35)
- Kiểm kê Git không thấy Dockerfile/Compose, Kubernetes, cấu hình reverse proxy, pipeline CI/CD, cấu hình firewall, NuGet lockfile hay manifest triển khai production. Không có căn cứ từ repo để kết luận container chạy root, DB mở ra ngoài, TLS ở edge hoặc hệ thống không có backup. [Danh sách bằng chứng cần lấy](07-security-checklist.md)
