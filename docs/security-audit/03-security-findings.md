# 03 · Phát hiện an toàn thông tin

**Mức độ** dựa trên phạm vi dữ liệu/quyền, tác động và điều kiện phơi nhiễm. **Confirmed** nghĩa là kiểm soát thiếu hoặc hành vi có bằng chứng tĩnh đủ từ snapshot. **Potential** nghĩa là còn điều kiện runtime, dữ liệu hoặc cách dùng chưa xác nhận. **Needs Verification** là kiểm soát cần bằng chứng vận hành. Không tính CVSS cho QLCD vì điều kiện triển khai, độ tiếp cận mạng và vai trò thực tế chưa đủ. C, I, A là Confidentiality, Integrity và Availability. P0 ưu tiên xử lý/kiểm tra ngay, P1 hardening, P2 chuẩn hóa. Tham chiếu OWASP Axx theo 2025 và APIx theo 2023. [OWASP Top 10:2025](https://top10.owasp.org/) · [OWASP API Top 10:2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/) · [MITRE CWE](https://cwe.mitre.org/data/index.html)

| ID | Tên | Mức độ | Trạng thái |
| --- | --- | --- | --- |
| [SEC-001](#sec-001) | Khóa ký JWT tĩnh trong mã nguồn | Critical | Confirmed |
| [SEC-002](#sec-002) | Mật khẩu nguyên văn lưu trong SQL và trả qua API quản trị | Critical | Confirmed |
| [SEC-003](#sec-003) | Credential kết nối SQL nằm trong cấu hình được Git theo dõi | High | Confirmed |
| [SEC-004](#sec-004) | Tài khoản seed và tài khoản tạo đơn vị có mật khẩu dự đoán được | High | Confirmed |
| [SEC-005](#sec-005) | Gắn minh chứng thay đổi chủ sở hữu mà không phân quyền tệp | High | Confirmed |
| [SEC-006](#sec-006) | Kiểm tra đơn vị chưa bao phủ quyền chức năng và quyền tự xem hồ sơ | High | Confirmed |
| [SEC-007](#sec-007) | Tham chiếu đoàn viên và đơn vị vượt ranh giới trong tài chính, thi đua | High | Confirmed |
| [SEC-008](#sec-008) | Đường dẫn lưu PDF chịu ảnh hưởng của đầu vào chưa ràng buộc | High | Confirmed |
| [SEC-009](#sec-009) | Fallback InMemory và migration/seed trong startup làm mờ lỗi production | High | Confirmed |
| [SEC-010](#sec-010) | Audit lưu dữ liệu đầy đủ nhưng thiếu danh tính thực hiện | High | Confirmed |
| [SEC-011](#sec-011) | Phiên JWT còn hiệu lực sau logout, khóa hoặc reset tài khoản | High | Confirmed |
| [SEC-012](#sec-012) | Dependency thuộc dải advisory và .NET 8 đã hết hỗ trợ | High | Confirmed |
| [SEC-013](#sec-013) | HTTPS và chính sách trình duyệt phụ thuộc lớp triển khai | High | Potential |
| [SEC-014](#sec-014) | Login và reset thiếu giới hạn và kiểm soát mật khẩu phù hợp | Medium | Confirmed |
| [SEC-015](#sec-015) | Kiểm tra PDF và vòng đời lưu trữ chưa đầy đủ | Medium | Confirmed |
| [SEC-016](#sec-016) | Tải minh chứng để lộ trạng thái tồn tại khi chưa xác thực | Low | Confirmed |
| [SEC-017](#sec-017) | Truy vấn và tải dữ liệu thiếu giới hạn nhất quán | Medium | Confirmed |
| [SEC-018](#sec-018) | Phản hồi lỗi gửi thông tin exception nội bộ | Medium | Confirmed |
| [SEC-019](#sec-019) | URL chứng chỉ từ dữ liệu nghiệp vụ được gắn trực tiếp vào liên kết | Medium | Potential |
| [SEC-020](#sec-020) | Validator đã đăng ký nhưng chưa nối vào đường xử lý command | Medium | Confirmed |
| [SEC-021](#sec-021) | Kiểm soát triển khai và vòng đời dữ liệu cần bằng chứng vận hành | Medium | Needs Verification |
| [SEC-022](#sec-022) | Repo thiếu gate bảo mật và kiểm thử ranh giới API | Medium | Confirmed |
| [SEC-023](#sec-023) | Tree và stats có nhánh mặc định mở rộng khi claim thiếu | Medium | Potential |
| [SEC-024](#sec-024) | Mật khẩu dùng SHA-256 nhanh, không salt | High | Confirmed |

## SEC-001

**Khóa ký JWT tĩnh trong mã nguồn** · **Critical** · **Confirmed**

- **Vị trí** — Khởi tạo JwtBearer và LoginCommandHandler tại POST /api/v1/auth/login.
- **Bằng chứng** — Cùng một literal làm khóa đối xứng ở phía ký và xác thực. API dùng claim vai trò ở các route quản trị. Issuer và audience bị tắt. [Program.cs:17–35](../../backend/QLCD.Api/Program.cs#L17-L35) · [LoginCommand.cs:51–68](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L51-L68) · [AccountsController.cs:14–16](../../backend/QLCD.Api/Controllers/AccountsController.cs#L14-L16)
- **Nguyên nhân gốc** — Vật liệu ký đóng gói trong mã, claim đã ký là nguồn thẩm quyền của máy chủ.
- **Điều kiện và khả năng** — Khả năng cao nếu giá trị tới người xem mã hoặc artifact và môi trường vẫn dùng khóa đó. Phạm vi triển khai chưa xác minh.
- **Tác động CIA** — C cao, I cao, A có thể cao. Mất độ tin cậy của danh tính và vai trò API.
- **Đối chiếu** — CWE-321, CWE-347 · OWASP A04, A07 · API2.
- **Khắc phục** — Xoay và vô hiệu hóa khóa cũ. Cấp khóa riêng theo môi trường qua kho bí mật, kiểm tra thuật toán, issuer, audience và lifetime.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · buộc đăng nhập lại.
- **Tiêu chí kiểm chứng** — Token mới hợp lệ, token từ khóa cũ hoặc sai issuer/audience bị từ chối.

## SEC-002

**Mật khẩu nguyên văn lưu trong SQL và trả qua API quản trị** · **Critical** · **Confirmed**

- **Vị trí** — AccountsController.ResetPassword, GET /api/v1/accounts, UI accounts và schema TaiKhoan.
- **Bằng chứng** — Reset, khởi tạo đơn vị và seed ghi PasswordRaw. DTO trả trường theo quyền ADMIN, UI cho xem và sao chép. Migration tạo cột, interceptor có thể sao thêm vào audit. Công cụ scratch theo dõi trong Git có đường in trường này ra console. [test_db.py:38–47](../../frontend/qlcd-web/scratch/test_db.py#L38-L47) · [AccountsController.cs:64–84](../../backend/QLCD.Api/Controllers/AccountsController.cs#L64-L84) · [GetAccountsQuery.cs:14–51](../../backend/QLCD.Application/Features/Accounts/Queries/GetAccounts/GetAccountsQuery.cs#L14-L51) · [page.tsx:192–201](../../frontend/qlcd-web/src/app/accounts/page.tsx#L192-L201) · [CreateUnionUnitCommand.cs:137–149](../../backend/QLCD.Application/Features/UnionUnits/Commands/CreateUnionUnit/CreateUnionUnitCommand.cs#L137-L149) · [DbInitializer.cs:413–448](../../backend/QLCD.Infrastructure/Data/DbInitializer.cs#L413-L448) · [20260621001936_InitialCreate.cs:206–217](../../backend/QLCD.Infrastructure/Migrations/20260621001936_InitialCreate.cs#L206-L217) · [AuditLogInterceptor.cs:48–76](../../backend/QLCD.Infrastructure/Interceptors/AuditLogInterceptor.cs#L48-L76)
- **Nguyên nhân gốc** — Mô hình cấp tài khoản coi mật khẩu là dữ liệu có thể hiển thị lại.
- **Điều kiện và khả năng** — API cần quyền ADMIN. DB, backup hoặc audit là bề mặt bổ sung nếu chứa mật khẩu thật.
- **Tác động CIA** — C cao, I cao, A gián tiếp. Chiếm danh tính và nguy cơ cho hệ thống khác nếu tái sử dụng mật khẩu.
- **Đối chiếu** — CWE-256, CWE-312, CWE-200 · OWASP A04, A07 · API3.
- **Khắc phục** — Bỏ trường khỏi DTO/UI, dừng ghi nguyên văn. Cấp/reset một lần, đổi mật khẩu và hủy phiên. Kiểm kê và làm sạch bản sao theo retention, lên migration bỏ cột.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · cao · đổi quy trình cấp lại mật khẩu.
- **Tiêu chí kiểm chứng** — Schema đích, phản hồi quản trị, log và bản xuất mới của fixture tạo/reset đều không chứa mật khẩu nguyên văn.

## SEC-003

**Credential kết nối SQL nằm trong cấu hình được Git theo dõi** · **High** · **Confirmed**

- **Vị trí** — appsettings.json, AddInfrastructureServices và kết nối SqlClient.
- **Bằng chứng** — DefaultConnection trong Git có trường mật khẩu và bật TrustServerCertificate. API cấp cấu hình này cho SqlClient. [appsettings.json:2–4](../../backend/QLCD.Api/appsettings.json#L2-L4) · [DependencyInjection.cs:19–55](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L19-L55)
- **Nguyên nhân gốc** — Cấu hình phát triển và bí mật được đóng gói cùng cơ chế kết nối.
- **Điều kiện và khả năng** — Có khả năng nếu credential còn hợp lệ và SQL có thể tiếp cận. Quyền SQL và mạng cần bằng chứng vận hành.
- **Tác động CIA** — C/I/A phụ thuộc quyền SQL. Có thể đọc/sửa dữ liệu ngoài chính sách API.
- **Đối chiếu** — CWE-798, CWE-295 · OWASP A02, A04.
- **Khắc phục** — Xoay credential, dùng danh tính dịch vụ hoặc vault theo môi trường, TLS có kiểm chứng chứng thư. Kiểm kê artifact/lịch sử bằng scanner nội bộ có redaction.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · cần phối hợp DBA.
- **Tiêu chí kiểm chứng** — Credential cũ bị vô hiệu, tài khoản runtime chỉ có quyền cần thiết và chứng thư SQL không hợp lệ bị từ chối.

## SEC-004

**Tài khoản seed và tài khoản tạo đơn vị có mật khẩu dự đoán được** · **High** · **Confirmed**

- **Vị trí** — DbInitializer.SeedAsync, CreateUnionUnitCommandHandler tại POST /api/v1/union-units.
- **Bằng chứng** — Startup gọi seed mọi môi trường. Bảng tài khoản trống dẫn đến tạo tài khoản ADMIN và tài khoản đơn vị với mật khẩu cố định. Handler tạo mật khẩu tạm từ tên đơn vị, bật tài khoản và lưu hai dạng. Công cụ scratch có đầu vào mật khẩu viết sẵn cho API login. [test_db.py:27–36](../../frontend/qlcd-web/scratch/test_db.py#L27-L36) · [Program.cs:79–96](../../backend/QLCD.Api/Program.cs#L79-L96) · [DbInitializer.cs:413–448](../../backend/QLCD.Infrastructure/Data/DbInitializer.cs#L413-L448) · [DbInitializer.cs:473–528](../../backend/QLCD.Infrastructure/Data/DbInitializer.cs#L473-L528) · [CreateUnionUnitCommand.cs:117–149](../../backend/QLCD.Application/Features/UnionUnits/Commands/CreateUnionUnit/CreateUnionUnitCommand.cs#L117-L149)
- **Nguyên nhân gốc** — Bootstrap và provisioning dùng thông tin xác thực định sẵn hoặc có thể suy đoán, thiếu kích hoạt một lần.
- **Điều kiện và khả năng** — Khả năng cao nếu môi trường chạy seed, còn mật khẩu ban đầu hoặc chuyển sang kho InMemory có seed.
- **Tác động CIA** — C và I cao, A gián tiếp. Tác động rộng nhất ở tài khoản quản trị.
- **Đối chiếu** — CWE-1392, CWE-521 · OWASP A07 · API2.
- **Khắc phục** — Tách seed demo, bootstrap một lần qua vận hành, cấp mã kích hoạt ngẫu nhiên ngắn hạn, rà soát và đổi tài khoản lịch sử.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · cần cấp lại cho quản lý đơn vị.
- **Tiêu chí kiểm chứng** — Môi trường production tương đương không có tài khoản demo. Tài khoản mới cần kích hoạt và mã đã dùng/hết hạn bị từ chối.

## SEC-005

**Gắn minh chứng thay đổi chủ sở hữu mà không phân quyền tệp** · **High** · **Confirmed**

- **Vị trí** — Create/Update của năm module nghiệp vụ và TransferUnionMemberCommandHandler.
- **Bằng chứng** — Sau khi kiểm tra đơn vị bản ghi, nhánh tệp tìm theo ID, ghi RelatedEntityId và OrganizationId mà thiếu kiểm tra đơn vị gốc, người tải, module hoặc trạng thái đã gắn. Download và delete tin OrganizationId hiện tại. [ActivityCommands.cs:66–76](../../backend/QLCD.Application/Features/Activities/Commands/ActivityCommands.cs#L66-L76) · [FinanceCommands.cs:63–73](../../backend/QLCD.Application/Features/Finance/Commands/FinanceCommands.cs#L63-L73) · [WelfareCommands.cs:155–163](../../backend/QLCD.Application/Features/Welfare/Commands/WelfareCommands.cs#L155-L163) · [InitiativeCommands.cs:164–173](../../backend/QLCD.Application/Features/Initiatives/Commands/InitiativeCommands.cs#L164-L173) · [EmulationCommands.cs:193–201](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L193-L201) · [TransferUnionMemberCommand.cs:104–116](../../backend/QLCD.Application/Features/UnionMembers/Commands/TransferUnionMember/TransferUnionMemberCommand.cs#L104-L116) · [EvidenceFilesController.cs:123–143](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L123-L143) · [EvidenceFilesController.cs:159–175](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L159-L175)
- **Nguyên nhân gốc** — Quyền thao tác với bản ghi cha thay thế kiểm tra quyền trên tài nguyên độc lập.
- **Điều kiện và khả năng** — Khả năng trung bình đến cao khi có quyền thao tác nghiệp vụ và biết ID tệp ngoài phạm vi. UUID hạn chế đoán mò.
- **Tác động CIA** — C và I cao, A cục bộ. Đổi phạm vi đọc/xóa và mất liên kết minh chứng.
- **Đối chiếu** — CWE-639, CWE-862 · OWASP A01 · API1.
- **Khắc phục** — Authorize tệp theo chủ sở hữu, trạng thái pending, đơn vị, module. Ghi bản ghi cha và liên kết trong cùng transaction, đối soát dữ liệu lịch sử.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa–cao · có thể từ chối dữ liệu cũ thiếu liên kết.
- **Tiêu chí kiểm chứng** — Tệp ngoài phạm vi, sai module, đã gắn hoặc sai chủ bị từ chối. Liên kết và bản ghi giữ nguyên khi điều kiện chặn.

## SEC-006

**Kiểm tra đơn vị chưa bao phủ quyền chức năng và quyền tự xem hồ sơ** · **High** · **Confirmed**

- **Vị trí** — UnionMembers, Finance, Welfare, Emulations, EvidenceFiles và các module ghi theo scope.
- **Bằng chứng** — Controller nghiệp vụ chủ yếu yêu cầu bearer. Scope cho vai trò không rỗng có org rơi về đơn vị hiện tại. Xem hồ sơ và xóa đoàn viên dựa vào đơn vị. Lệnh thi đua/phúc lợi ghi trường duyệt/trạng thái từ request. Cập nhật hồ sơ đổi đơn vị ngoài luồng chuyển và không tạo lịch sử. Ma trận tài liệu dành quyền tự xem cho đoàn viên và giới hạn quyền tài chính của tổ trưởng. Seed thấy ADMIN, CDCS, CDBP, TOCD. [OrganizationScopeService.cs:22–68](../../backend/QLCD.Infrastructure/Services/OrganizationScopeService.cs#L22-L68) · [GetUnionMemberDetailQuery.cs:75–101](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMemberDetail/GetUnionMemberDetailQuery.cs#L75-L101) · [DeleteUnionMemberCommand.cs:24–40](../../backend/QLCD.Application/Features/UnionMembers/Commands/DeleteUnionMember/DeleteUnionMemberCommand.cs#L24-L40) · [UpdateUnionMemberCommand.cs:80–90](../../backend/QLCD.Application/Features/UnionMembers/Commands/UpdateUnionMember/UpdateUnionMemberCommand.cs#L80-L90) · [UpdateUnionMemberCommand.cs:126–163](../../backend/QLCD.Application/Features/UnionMembers/Commands/UpdateUnionMember/UpdateUnionMemberCommand.cs#L126-L163) · [TransferUnionMemberCommand.cs:33–70](../../backend/QLCD.Application/Features/UnionMembers/Commands/TransferUnionMember/TransferUnionMemberCommand.cs#L33-L70) · [FinanceController.cs:53–115](../../backend/QLCD.Api/Controllers/FinanceController.cs#L53-L115) · [EmulationCommands.cs:180–190](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L180-L190) · [WelfareCommands.cs:144–152](../../backend/QLCD.Application/Features/Welfare/Commands/WelfareCommands.cs#L144-L152) · [EvidenceFilesController.cs:155–175](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L155-L175) · [07_PERMISSION_MATRIX.md:6–28](../../docs/07_PERMISSION_MATRIX.md#L6-L28) · [08-Permission-Matrix.md:12–25](../../docs/08-Permission-Matrix.md#L12-L25) · [DbInitializer.cs:413–525](../../backend/QLCD.Infrastructure/Data/DbInitializer.cs#L413-L525)
- **Nguyên nhân gốc** — Scope dữ liệu kiêm quyền nghiệp vụ. Thiếu ánh xạ account–member và phân tách quyền đề xuất, sửa, duyệt.
- **Điều kiện và khả năng** — Khả năng cao với vai trò hạn chế có đơn vị hợp lệ. DOANVIEN/UNION_MEMBER cần xác minh việc cấp quyền trên môi trường và ánh xạ chính thức.
- **Tác động CIA** — C và I cao, A cục bộ. Xem hồ sơ, sửa/xóa hoặc phê duyệt ngoài quyền nghiệp vụ.
- **Đối chiếu** — CWE-862, CWE-863, CWE-915 · OWASP A01 · API3, API5.
- **Khắc phục** — Chốt action matrix, buộc policy chức năng cùng kiểm tra resource/self. Tách command đề xuất/duyệt/chuyển, dùng workflow chung cho đổi đơn vị.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · cao · cần duyệt ma trận vai trò.
- **Tiêu chí kiểm chứng** — Kiểm thử vai trò × chức năng × tài nguyên tự thân/cùng đơn vị/ngoài đơn vị. Đổi đơn vị áp đúng quyền và sinh đúng một lịch sử.

## SEC-007

**Tham chiếu đoàn viên và đơn vị vượt ranh giới trong tài chính, thi đua** · **High** · **Confirmed**

- **Vị trí** — Create/UpdateFinance, GetFinance, Create/Update/DeleteEmulation, GetEmulations.
- **Bằng chứng** — Tài chính kiểm tra DonViId rồi gán DoanVienId riêng, danh sách đọc họ tên liên kết. Thi đua khi có đoàn viên kiểm tra scope theo đoàn viên nhưng vẫn lưu đơn vị từ request, truy vấn đọc dùng OR. Update/delete bỏ kiểm tra nếu không xác định được đơn vị gốc. FK chỉ xác minh từng khóa tồn tại. [FinanceCommands.cs:40–59](../../backend/QLCD.Application/Features/Finance/Commands/FinanceCommands.cs#L40-L59) · [FinanceCommands.cs:112–138](../../backend/QLCD.Application/Features/Finance/Commands/FinanceCommands.cs#L112-L138) · [GetFinanceQuery.cs:64–76](../../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs#L64-L76) · [GetFinanceQuery.cs:114–125](../../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs#L114-L125) · [EmulationCommands.cs:41–79](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L41-L79) · [EmulationCommands.cs:140–188](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L140-L188) · [EmulationCommands.cs:238–251](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L238-L251) · [GetEmulationsQuery.cs:61–71](../../backend/QLCD.Application/Features/Emulations/Queries/GetEmulations/GetEmulationsQuery.cs#L61-L71) · [QLCDDbContext.cs:161–178](../../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs#L161-L178) · [QLCDDbContext.cs:220–237](../../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs#L220-L237)
- **Nguyên nhân gốc** — Quy tắc xác định chủ khác nhau giữa ghi và đọc, thiếu ràng buộc tương thích giữa các tham chiếu.
- **Điều kiện và khả năng** — Có khả năng với tài khoản xác thực có quyền ghi trong đơn vị và ID hợp lệ. Bỏ kiểm tra chủ gốc cần bản ghi tương ứng.
- **Tác động CIA** — C cao đối với họ tên và dữ liệu liên đơn vị, I cao, A cục bộ.
- **Đối chiếu** — CWE-639, CWE-863 · OWASP A01 · API1, API3.
- **Khắc phục** — Suy đơn vị chính tắc hoặc buộc hai tham chiếu tương thích, từ chối nếu không xác định chủ. Dùng cùng predicate cho đọc/ghi.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · cần đối soát dữ liệu lịch sử.
- **Tiêu chí kiểm chứng** — Tham chiếu không tương thích bị từ chối trước ghi. Danh sách và quyền sửa/xóa nhất quán sau đối soát.

## SEC-008

**Đường dẫn lưu PDF chịu ảnh hưởng của đầu vào chưa ràng buộc** · **High** · **Confirmed**

- **Vị trí** — EvidenceFilesController.Upload và Download.
- **Bằng chứng** — moduleName từ query vào Path.Combine trước Directory.CreateDirectory và FileStream. Tên tệp vật lý ngẫu nhiên, thư mục thiếu kiểm tra biên. Download dùng StoragePath từ metadata. [EvidenceFilesController.cs:33–35](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L33-L35) · [EvidenceFilesController.cs:50–96](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L50-L96) · [EvidenceFilesController.cs:131–143](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L131-L143) · [EvidenceFile.cs:8–16](../../backend/QLCD.Domain/Entities/EvidenceFile.cs#L8-L16)
- **Nguyên nhân gốc** — Tên module nghiệp vụ trở thành thành phần đường dẫn đặc quyền, thiếu allowlist và containment.
- **Điều kiện và khả năng** — Khả năng trung bình khi có quyền upload và tiến trình được ghi ngoài cây lưu trữ. Tên ngẫu nhiên và phần mở rộng cố định giới hạn kiểm soát đích. Đọc tùy ý hoặc thực thi chưa được xác nhận.
- **Tác động CIA** — I và A cao trong phạm vi tiến trình ghi được, C phụ thuộc cấu hình.
- **Đối chiếu** — CWE-22, CWE-73 · OWASP A01, A05 · API8.
- **Khắc phục** — Ánh xạ module cố định, dùng storage key do hệ thống sinh, kiểm tra containment cho ghi/đọc và hạ quyền tiến trình.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · cần tương thích metadata file cũ.
- **Tiêu chí kiểm chứng** — Resolver và adapter lưu trữ chỉ giải đường trong root riêng tư, từ chối giá trị module ngoài danh sách.

## SEC-009

**Fallback InMemory và migration/seed trong startup làm mờ lỗi production** · **High** · **Confirmed**

- **Vị trí** — AddInfrastructureServices và bootstrap API.
- **Bằng chứng** — Callback DbContext mở kết nối đồng bộ, bắt mọi lỗi và chọn InMemory nếu SQL lỗi/mất cấu hình. Startup migrate nếu là SQL, vẫn seed provider được chọn, bắt lỗi migrate/seed rồi Run. [DependencyInjection.cs:19–57](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L19-L57) · [Program.cs:79–99](../../backend/QLCD.Api/Program.cs#L79-L99)
- **Nguyên nhân gốc** — Provider phụ thuộc probe thay vì môi trường cố định. Readiness và quyền migration gắn với tiến trình phục vụ.
- **Điều kiện và khả năng** — Khả năng cao khi SQL không kết nối được. Nếu provider khác nhau giữa lần resolve/instance, yêu cầu có thể nhận kết quả từ kho khác. Kho InMemory có thể nhận seed khi startup đi vào nhánh này.
- **Tác động CIA** — I và A cao do kho không bền và lệch trạng thái. C cao nếu tài khoản seed/cấu hình sai dữ liệu bị phơi nhiễm.
- **Đối chiếu** — CWE-636, CWE-703 · OWASP A02, A10.
- **Khắc phục** — Chỉ dùng InMemory qua cấu hình test/dev tường minh. Fail closed và readiness có kiểm tra SQL. Migrate qua job dùng credential DDL riêng.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa–cao · có thể trả 503 khi SQL lỗi.
- **Tiêu chí kiểm chứng** — SQL lỗi không sinh kho thay thế, instance chưa sẵn sàng không nhận traffic. Migration và khôi phục được thử độc lập.

## SEC-010

**Audit lưu dữ liệu đầy đủ nhưng thiếu danh tính thực hiện** · **High** · **Confirmed**

- **Vị trí** — AuditLogInterceptor, AuthController và EvidenceFilesController.
- **Bằng chứng** — Interceptor ghi snapshot thuộc tính cũ/mới, gồm trường nhạy cảm của TaiKhoan và DoanVien khi thay đổi, với UserId = System. Login và download thiếu sự kiện audit có cấu trúc. [AuditLogInterceptor.cs:35–84](../../backend/QLCD.Infrastructure/Interceptors/AuditLogInterceptor.cs#L35-L84) · [AuditLogInterceptor.cs:103–114](../../backend/QLCD.Infrastructure/Interceptors/AuditLogInterceptor.cs#L103-L114) · [TaiKhoan.cs:7–15](../../backend/QLCD.Domain/Entities/TaiKhoan.cs#L7-L15) · [GetUnionMemberDetailQuery.cs:90–106](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMemberDetail/GetUnionMemberDetailQuery.cs#L90-L106) · [AuthController.cs:20–35](../../backend/QLCD.Api/Controllers/AuthController.cs#L20-L35) · [EvidenceFilesController.cs:117–151](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L117-L151)
- **Nguyên nhân gốc** — Audit lấy snapshot change tracker thay schema sự kiện tối thiểu, thiếu principal/correlation và luồng audit đọc/deny.
- **Điều kiện và khả năng** — Phơi nhiễm phụ thuộc quyền đọc audit/backup và dữ liệu đã ghi. Thiếu actor xác nhận tĩnh khi interceptor xử lý lần lưu.
- **Tác động CIA** — C cao vì sao chép bí mật/PII, I cao với khả năng truy vết, A gián tiếp qua dung lượng.
- **Đối chiếu** — CWE-532, CWE-778 · OWASP A09.
- **Khắc phục** — Giới hạn trường ghi bằng allowlist. Ghi actor, action, target, result, correlation ID. Bảo vệ log và xử lý bản sao cũ theo retention.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · vừa · cần chuyển truy vấn audit.
- **Tiêu chí kiểm chứng** — Audit ghi đúng actor và tương quan request. Fixture xác nhận sự kiện quản trị, deny và không có mật khẩu hoặc CCCD đầy đủ.

## SEC-011

**Phiên JWT còn hiệu lực sau logout, khóa hoặc reset tài khoản** · **High** · **Confirmed**

- **Vị trí** — LoginCommandHandler, JwtBearer, AccountsController và AuthProvider.
- **Bằng chứng** — Token tồn tại bảy ngày, mang role/org. Active được kiểm khi login. Toggle/reset cập nhật DB mà pipeline thiếu kiểm trạng thái/revocation. Logout xóa localStorage. Interceptor đọc JWT từ Web Storage để gắn bearer. [LoginCommand.cs:40–64](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L64) · [Program.cs:19–35](../../backend/QLCD.Api/Program.cs#L19-L35) · [AccountsController.cs:42–84](../../backend/QLCD.Api/Controllers/AccountsController.cs#L42-L84) · [auth-context.tsx:39–45](../../frontend/qlcd-web/src/lib/auth-context.tsx#L39-L45) · [auth-context.tsx:85–96](../../frontend/qlcd-web/src/lib/auth-context.tsx#L85-L96) · [api.ts:8–19](../../frontend/qlcd-web/src/lib/api.ts#L8-L19)
- **Nguyên nhân gốc** — Access token tự chứa, thiếu security stamp/revocation và cách ly phiên trong trình duyệt.
- **Điều kiện và khả năng** — Khả năng cao khi token đã phát hành còn thời hạn và có người nắm token. Sự kiện rò rỉ token chưa được xác minh.
- **Tác động CIA** — C/I cao theo quyền của phiên, A phụ thuộc quyền ghi và quản trị.
- **Đối chiếu** — CWE-613, CWE-922 · OWASP A07 · API2.
- **Khắc phục** — Access token ngắn, security stamp, refresh rotation/revocation hoặc phiên BFF HttpOnly. Logout server, đổi quyền và reset hủy phiên.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · cao · thay đổi vòng đời phiên.
- **Tiêu chí kiểm chứng** — Sau logout, khóa, reset hoặc đổi quyền, phiên cũ bị vô hiệu trong SLA. Kiểm tra rotation và UI xử lý 401.

## SEC-012

**Dependency thuộc dải advisory và .NET 8 đã hết hỗ trợ** · **High** · **Confirmed**

- **Vị trí** — Frontend lockfile/config, backend project refs và cache restore cục bộ.
- **Bằng chứng** — Next 16.2.9 và sharp 0.34.5 thuộc dải advisory image optimization/librsvg. Axios 1.18.0 thuộc dải advisory HTTP/2. Backend target net8.0, cache restore cục bộ resolve SqlClient 5.1.1, thấp hơn bản vá 5.1.3 cho CVE-2024-0056. [package-lock.json:5507–5538](../../frontend/qlcd-web/package-lock.json#L5507-L5538) · [package-lock.json:6336–6350](../../frontend/qlcd-web/package-lock.json#L6336-L6350) · [package-lock.json:2646–2657](../../frontend/qlcd-web/package-lock.json#L2646-L2657) · [QLCD.Infrastructure.csproj:10–20](../../backend/QLCD.Infrastructure/QLCD.Infrastructure.csproj#L10-L20) · [QLCD.Api.csproj:3–16](../../backend/QLCD.Api/QLCD.Api.csproj#L3-L16) · [Vercel GHSA-2464](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) · [sharp GHSA-wq5f](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) · [Axios GHSA-542g](https://github.com/axios/axios/security/advisories/GHSA-542g-h47m-68v8) · [SqlClient 5.1.3](https://github.com/dotnet/SqlClient/blob/main/release-notes/5.1/5.1.3.md) · [Vòng đời .NET](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)
- **Nguyên nhân gốc** — Phiên bản build giữ từ cũ và thiếu gate kiểm tra artifact. .NET 8 hết hỗ trợ ngày 10/11/2026.
- **Điều kiện và khả năng** — Version match đã xác nhận. Phơi nhiễm phụ thuộc glibc, image optimizer và binary native, đường HTTP/2 phía Node, hoặc SQL và graph/runtime phát hành. Next config mặc định, chưa thấy mã ứng dụng dùng next/image, next/og hay Server Action. [next.config.ts:1–7](../../frontend/qlcd-web/next.config.ts#L1-L7) · [api.ts:1–19](../../frontend/qlcd-web/src/lib/api.ts#L1-L19)
- **Tác động CIA** — C/I/A có thể cao nếu điều kiện của advisory Next/sharp hội đủ. SQL ảnh hưởng xác thực kết nối, Axios mẫu ảnh hưởng A.
- **Đối chiếu** — CWE theo advisory · OWASP A03, A08.
- **Khắc phục** — Kiểm tra build phát hành và thu hẹp image optimizer nếu không dùng. Cập nhật Next/sharp, Axios và SqlClient lên bản được hỗ trợ đã vá. Chuyển sang .NET 10 LTS và thiết lập SCA nội bộ.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 · cao · cần kiểm tra ảnh native, Node, SQL.
- **Tiêu chí kiểm chứng** — SBOM artifact khớp dải đã vá, có xác minh reachability, smoke test Next, SQL TLS, JWT và CRUD qua phiên bản đích.

## SEC-013

**HTTPS và chính sách trình duyệt phụ thuộc lớp triển khai** · **High** · **Potential**

- **Vị trí** — Program middleware, next.config.ts, API client và link minh chứng.
- **Bằng chứng** — Client và link PDF dùng HTTP localhost cố định. CORS chỉ cho origin dev, kèm credentials và mọi method/header. Pipeline không cấu hình HSTS/HTTPS hoặc trusted forwarded headers, Next config không đặt header bảo mật. Swagger chỉ bật Development. [Program.cs:48–77](../../backend/QLCD.Api/Program.cs#L48-L77) · [launchSettings.json:12–30](../../backend/QLCD.Api/Properties/launchSettings.json#L12-L30) · [api.ts:1–19](../../frontend/qlcd-web/src/lib/api.ts#L1-L19) · [EvidenceUpload.tsx:129–136](../../frontend/qlcd-web/src/components/EvidenceUpload.tsx#L129-L136) · [next.config.ts:1–7](../../frontend/qlcd-web/next.config.ts#L1-L7)
- **Nguyên nhân gốc** — Thiết lập phát triển dùng trực tiếp trong client và thiếu hợp đồng cấu hình production ở repo.
- **Điều kiện và khả năng** — Phơi nhiễm cao nếu ingress hoặc URL được phát hành cho phép HTTP ngoài loopback. Reverse proxy có thể bù một phần và chưa được cấp bằng chứng.
- **Tác động CIA** — C và I cao nếu traffic chứa mật khẩu, JWT hoặc dữ liệu cá nhân đi qua mạng không mã hóa. A cục bộ do mixed content/CORS.
- **Đối chiếu** — CWE-319, CWE-693 · OWASP A02, A04 · API8.
- **Khắc phục** — Triển khai cùng origin qua ingress HTTPS hoặc URL API HTTPS theo môi trường, HSTS, CSP và nosniff. Chỉ tin proxy đã khai báo. Rà soát CORS và tắt credentials nếu dùng bearer thuần.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 kiểm tra · vừa · có thể ảnh hưởng URL/CORS.
- **Tiêu chí kiểm chứng** — Build production trỏ đúng API, header hiệu lực qua ingress, HTTP ngoài loopback không chuyển bearer, origin ngoài danh sách không được cấp quyền đọc.

## SEC-014

**Login và reset thiếu giới hạn và kiểm soát mật khẩu phù hợp** · **Medium** · **Confirmed**

- **Vị trí** — POST /api/v1/auth/login, {id}/reset-password, Program.
- **Bằng chứng** — Login kiểm active cùng thông báo thất bại chung. Pipeline thiếu rate limit, mã login thiếu lockout/backoff và MFA. Reset chỉ kiểm có giá trị khác khoảng trắng. [AuthController.cs:20–35](../../backend/QLCD.Api/Controllers/AuthController.cs#L20-L35) · [LoginCommand.cs:15–19](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L15-L19) · [LoginCommand.cs:40–49](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L49) · [AccountsController.cs:64–82](../../backend/QLCD.Api/Controllers/AccountsController.cs#L64-L82) · [Program.cs:63–77](../../backend/QLCD.Api/Program.cs#L63-L77)
- **Nguyên nhân gốc** — Thiếu chính sách chung cho credential và kiểm soát thử đăng nhập. Rate limit ở edge chưa xác minh.
- **Điều kiện và khả năng** — Khả năng trung bình nếu endpoint tiếp cận được và edge thiếu throttle. Tác động cao hơn với mật khẩu yếu và tài khoản đặc quyền.
- **Tác động CIA** — C/I có thể cao theo tài khoản, A cục bộ nếu quá tải hoặc áp lockout thiếu cân nhắc.
- **Đối chiếu** — CWE-307, CWE-521 · OWASP A07 · API2, API4.
- **Khắc phục** — Rate limit theo tài khoản và nguồn, backoff có giới hạn, MFA cho đặc quyền, giới hạn độ dài đầu vào và chặn mật khẩu phổ biến.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa · theo dõi khóa nhầm.
- **Tiêu chí kiểm chứng** — Kiểm thử chính sách mới theo ngưỡng cố định trong fixture, nhận 429 phù hợp, thông báo chung và tài khoản hợp lệ vẫn truy cập được.

## SEC-015

**Kiểm tra PDF và vòng đời lưu trữ chưa đầy đủ** · **Medium** · **Confirmed**

- **Vị trí** — EvidenceFilesController.Upload/Download/Delete, EvidenceFile, ActivityCommands.
- **Bằng chứng** — Upload có giới hạn 20 MiB cho request và file, chỉ kiểm phần mở rộng, sau đó gán application/pdf. Download đọc toàn bộ vào bộ nhớ. File được ghi trước DB, xóa chỉ soft delete. Handler gắn minh chứng ở lần SaveChanges riêng sau bản ghi cha. [EvidenceFilesController.cs:33–55](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L33-L55) · [EvidenceFilesController.cs:70–96](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L70-L96) · [EvidenceFilesController.cs:137–143](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L137-L143) · [EvidenceFilesController.cs:168–177](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L168-L177) · [ActivityCommands.cs:63–75](../../backend/QLCD.Application/Features/Activities/Commands/ActivityCommands.cs#L63-L75) · [20260621222853_AddEvidenceFiles.cs:16–34](../../backend/QLCD.Infrastructure/Migrations/20260621222853_AddEvidenceFiles.cs#L16-L34)
- **Nguyên nhân gốc** — Thiếu xác minh nội dung, quarantine, quota tổng dung lượng, cơ chế đồng bộ metadata và byte.
- **Điều kiện và khả năng** — Có khả năng với tài khoản có quyền upload, lỗi DB/I/O hoặc lượng tải đồng thời. Không có căn cứ khẳng định lỗi thực thi trên máy chủ từ luồng PDF này.
- **Tác động CIA** — C phụ thuộc nội dung và quyền lưu giữ, I trung bình vì file mồ côi, A trung bình vì đĩa và bộ nhớ.
- **Đối chiếu** — CWE-434, CWE-400, CWE-404 · OWASP A05, A06 · API4.
- **Khắc phục** — Quarantine, kiểm PDF bằng parser an toàn và kiểm tra malware; giới hạn quota/số request và stream. Bù trừ lỗi để không phát hành metadata lỗi; cleanup có retention và legal hold.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · cao · cần chuyển dữ liệu và đo tài nguyên.
- **Tiêu chí kiểm chứng** — Fixture PDF đúng được tải theo quyền; file sai định dạng, quá hạn mức và trạng thái chưa duyệt bị từ chối. Lỗi lưu không để file mồ côi vĩnh viễn.

## SEC-016

**Tải minh chứng để lộ trạng thái tồn tại khi chưa xác thực** · **Low** · **Confirmed**

- **Vị trí** — GET /api/v1/evidence-files/download/{id}, EvidenceUpload.
- **Bằng chứng** — AllowAnonymous cho action chạy. ID không có cho 404; ID hiện hữu, scope không có cho 403. Scope trả danh sách rỗng khi thiếu role, do đó đường đọc byte vẫn bị chặn cho anonymous bình thường. Link trực tiếp của frontend không đi qua interceptor bearer. [EvidenceFilesController.cs:117–143](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L117-L143) · [OrganizationScopeService.cs:22–36](../../backend/QLCD.Infrastructure/Services/OrganizationScopeService.cs#L22-L36) · [OrganizationScopeService.cs:60–68](../../backend/QLCD.Infrastructure/Services/OrganizationScopeService.cs#L60-L68) · [EvidenceUpload.tsx:129–136](../../frontend/qlcd-web/src/components/EvidenceUpload.tsx#L129-L136) · [api.ts:8–19](../../frontend/qlcd-web/src/lib/api.ts#L8-L19)
- **Nguyên nhân gốc** — Tra metadata trước xác thực. UI điều hướng khác cơ chế xác thực của API.
- **Điều kiện và khả năng** — Khả năng thấp với người dùng ẩn danh có ID tài nguyên và truy cập API. Bytes minh chứng không được xác nhận là công khai.
- **Tác động CIA** — C thấp đối với sự tồn tại bản ghi, I không trực tiếp, A thấp do lỗi tải hợp lệ.
- **Đối chiếu** — CWE-203 · OWASP A01 · API1, API8.
- **Khắc phục** — Bỏ AllowAnonymous. Từ chối nhất quán tài nguyên ngoài scope. UI tải qua API đã xác thực hoặc phiên BFF, tránh JWT trong URL.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P2 · vừa · cần sửa cách mở PDF.
- **Tiêu chí kiểm chứng** — Anonymous nhận 401 đồng nhất. ID ngoài scope và ID thiếu theo cùng hợp đồng 404 nếu chọn che sự tồn tại; download hợp lệ hoạt động.

## SEC-017

**Truy vấn và tải dữ liệu thiếu giới hạn nhất quán** · **Medium** · **Confirmed**

- **Vị trí** — UnionMembers.GetAll, query Finance/Activities/Catalogs, UnionUnits.stats/tree.
- **Bằng chứng** — Page/PageSize truyền thẳng vào Skip/Take. Nhiều danh sách materialize toàn bộ, thống kê tải tập dữ liệu rộng và có truy vấn trong vòng lặp. [UnionMembersController.cs:28–47](../../backend/QLCD.Api/Controllers/UnionMembersController.cs#L28-L47) · [GetUnionMembersQuery.cs:103–137](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMembers/GetUnionMembersQuery.cs#L103-L137) · [GetFinanceQuery.cs:88–104](../../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs#L88-L104) · [GetActivitiesQuery.cs:95–108](../../backend/QLCD.Application/Features/Activities/Queries/GetActivities/GetActivitiesQuery.cs#L95-L108) · [GetCatalogsQuery.cs:43–76](../../backend/QLCD.Application/Features/Catalogs/Queries/GetCatalogs/GetCatalogsQuery.cs#L43-L76) · [GetUnionStatsQuery.cs:104–144](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionStats/GetUnionStatsQuery.cs#L104-L144) · [GetUnionStatsQuery.cs:190–230](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionStats/GetUnionStatsQuery.cs#L190-L230) · [GetUnionUnitsTreeQuery.cs:56–75](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionUnitsTree/GetUnionUnitsTreeQuery.cs#L56-L75)
- **Nguyên nhân gốc** — Thiếu hợp đồng pagination, giới hạn tìm kiếm và phạm vi truy vấn từ đầu.
- **Điều kiện và khả năng** — Khả năng trung bình khi dữ liệu tăng hoặc có nhiều yêu cầu được phép. Ngưỡng thực tế chưa đo.
- **Tác động CIA** — C thấp theo scope hiện hành, I thấp, A trung bình đến cao theo tải.
- **Đối chiếu** — CWE-770, CWE-400 · OWASP A06, A10 · API4.
- **Khắc phục** — Validate page và cap page size, pagination có sort ổn định, giới hạn filter/time range. Đẩy aggregate xuống SQL, lọc sớm và kiểm tra index theo query plan.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa · cập nhật client cho pagination.
- **Tiêu chí kiểm chứng** — Đầu vào biên cho kết quả ổn định, kết quả phân trang đủ/sắp đúng, độ trễ và truy vấn nằm trong ngân sách đã đo với seed tổng hợp.

## SEC-018

**Phản hồi lỗi gửi thông tin exception nội bộ** · **Medium** · **Confirmed**

- **Vị trí** — AuthController, AccountsController, UnionMembersController, EvidenceFilesController.
- **Bằng chứng** — Catch chung nối ex.Message vào 500, gồm login anonymous và xử lý tệp. Không thấy handler tập trung thay phản hồi này. [AuthController.cs:20–35](../../backend/QLCD.Api/Controllers/AuthController.cs#L20-L35) · [AccountsController.cs:32–39](../../backend/QLCD.Api/Controllers/AccountsController.cs#L32-L39) · [UnionMembersController.cs:104–126](../../backend/QLCD.Api/Controllers/UnionMembersController.cs#L104-L126) · [EvidenceFilesController.cs:145–151](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L145-L151) · [Program.cs:63–77](../../backend/QLCD.Api/Program.cs#L63-L77)
- **Nguyên nhân gốc** — Controller tự định dạng lỗi và trộn thông báo nghiệp vụ với lỗi hạ tầng.
- **Điều kiện và khả năng** — Khả năng trung bình khi DB/FK hoặc filesystem phát sinh exception. Chi tiết lộ ra phụ thuộc loại exception.
- **Tác động CIA** — C trung bình đối với cấu trúc/đường dẫn lỗi, I gián tiếp, A thấp.
- **Đối chiếu** — CWE-209 · OWASP A02, A10 · API8.
- **Khắc phục** — Chuẩn hóa ProblemDetails và mã lỗi ổn định, client nhận thông báo an toàn, server giữ log có redaction, correlation ID và phân biệt 400/401/403/404/409/500.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa · frontend phụ thuộc cấu trúc message.
- **Tiêu chí kiểm chứng** — Lỗi validation/FK/I/O giả lập có status chuẩn và ID tra soát, payload không chứa đường dẫn/constraint/stack/credential.

## SEC-019

**URL chứng chỉ từ dữ liệu nghiệp vụ được gắn trực tiếp vào liên kết** · **Medium** · **Potential**

- **Vị trí** — UpdateUnionMember, GetUnionMemberDetail và trang members/[id].
- **Bằng chứng** — Cập nhật lưu URL từ DTO, chi tiết trả lại và frontend đặt vào href. Không thấy allowlist scheme/origin trên đường này. [UpdateUnionMemberCommand.cs:146–163](../../backend/QLCD.Application/Features/UnionMembers/Commands/UpdateUnionMember/UpdateUnionMemberCommand.cs#L146-L163) · [GetUnionMemberDetailQuery.cs:122–132](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMemberDetail/GetUnionMemberDetailQuery.cs#L122-L132) · [page.tsx:516–531](../../frontend/qlcd-web/src/app/members/%5Bid%5D/page.tsx#L516-L531)
- **Nguyên nhân gốc** — URL do người dùng cung cấp được dùng làm điều hướng. React có cơ chế xử lý giá trị nguy hiểm riêng.
- **Điều kiện và khả năng** — Khả năng trung bình đối với link ngoài/phishing khi người xem nhấp. XSS phụ thuộc URL, cách React xử lý và browser. Không thấy API fetch link qua HTTP nên chưa có bằng chứng SSRF.
- **Tác động CIA** — C/I có thể bị ảnh hưởng qua điều hướng và đánh cắp thông tin, A thấp.
- **Đối chiếu** — CWE-20, CWE-79 nếu có thực thi · OWASP A05.
- **Khắc phục** — Đổi sang ID minh chứng nội bộ. Nếu cần link ngoài, validate scheme và origin ở backend, render danh sách tin cậy ở UI.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P2 · thấp–vừa · liên kết lịch sử có thể bị chặn.
- **Tiêu chí kiểm chứng** — Chứng chỉ nội bộ mở đúng quyền. Giá trị ngoài chính sách không được lưu/render thành liên kết mở được.

## SEC-020

**Validator đã đăng ký nhưng chưa nối vào đường xử lý command** · **Medium** · **Confirmed**

- **Vị trí** — Application.DependencyInjection, UnionMembersController, validator tạo/chuyển đoàn viên.
- **Bằng chứng** — Có AddValidatorsFromAssembly và các rule CCCD/email/lý do, nhưng đăng ký MediatR chỉ quét handler, controller gửi thẳng và đường xử lý không gọi các validator này. EF constraints giới hạn một số kiểu/độ dài. [DependencyInjection.cs:9–21](../../backend/QLCD.Application/DependencyInjection.cs#L9-L21) · [CreateUnionMemberCommandValidator.cs:8–30](../../backend/QLCD.Application/Features/UnionMembers/Commands/CreateUnionMember/CreateUnionMemberCommandValidator.cs#L8-L30) · [TransferUnionMemberCommandValidator.cs:7–20](../../backend/QLCD.Application/Features/UnionMembers/Commands/TransferUnionMember/TransferUnionMemberCommandValidator.cs#L7-L20) · [UnionMembersController.cs:82–100](../../backend/QLCD.Api/Controllers/UnionMembersController.cs#L82-L100) · [UnionMembersController.cs:152–179](../../backend/QLCD.Api/Controllers/UnionMembersController.cs#L152-L179) · [QLCDDbContext.cs:61–74](../../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs#L61-L74)
- **Nguyên nhân gốc** — Đăng ký DI chỉ làm validator có thể được resolve. Không có hợp đồng validation chung giữa HTTP và handler.
- **Điều kiện và khả năng** — Khả năng cao với input xác thực sai nghiệp vụ, tùy DB có thể ghi dữ liệu lỗi hoặc trả 500. Các kiểm tra thủ công hiện hữu vẫn có hiệu lực.
- **Tác động CIA** — I trung bình, A thấp–trung bình vì lỗi hệ thống, C thấp.
- **Đối chiếu** — CWE-20 · OWASP A06, A10 · API8.
- **Khắc phục** — Thêm validation behavior cho MediatR, validate ở biên MVC cho action ngoài pipeline. Rule rõ về chuỗi, enum, ngày, số tiền và quan hệ. Giữ FK/unique là lớp cuối.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa · dữ liệu cũ có thể vi phạm rule mới.
- **Tiêu chí kiểm chứng** — Fixture invalid cho 400 trước SaveChanges cả khi gửi qua API lẫn IMediator, các DTO hợp lệ cũ vẫn tương thích theo baseline.

## SEC-021

**Kiểm soát triển khai và vòng đời dữ liệu cần bằng chứng vận hành** · **Medium** · **Needs Verification**

- **Vị trí** — SQL Server, thư mục file, backup, môi trường production.
- **Bằng chứng** — Repo cho thấy cấu hình SQL, soft delete chung và lưu file local. Không thấy manifests hạ tầng, tài liệu restore đã diễn tập hay cấu hình mã hóa/retention có thể xác nhận từ mã. [appsettings.json:2–4](../../backend/QLCD.Api/appsettings.json#L2-L4) · [QLCDDbContext.cs:251–263](../../backend/QLCD.Infrastructure/Data/QLCDDbContext.cs#L251-L263) · [EvidenceFilesController.cs:63–96](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L63-L96) · [EvidenceFilesController.cs:168–177](../../backend/QLCD.Api/Controllers/EvidenceFilesController.cs#L168-L177) · [launchSettings.json:12–30](../../backend/QLCD.Api/Properties/launchSettings.json#L12-L30)
- **Nguyên nhân gốc** — Kiểm soát storage, backup, ACL, mạng và khôi phục thuộc môi trường chưa có artifact trong phạm vi.
- **Điều kiện và khả năng** — Chưa biết. Sự cố ổ đĩa/SQL, quyền quá rộng, bản snapshot tồn lâu hoặc file local khác nhau giữa instance có thể làm tăng tác động.
- **Tác động CIA** — C/I/A có thể cao theo kết quả xác minh. Mức Medium tạm thời cho khoảng trống bằng chứng.
- **Đối chiếu** — ISO/IEC 27001 Annex A 8.10, 8.13, 8.20, 8.24 · OWASP A02 nếu có cấu hình yếu.
- **Khắc phục** — Thu cấu hình ingress/SQL/ACL đã redaction, danh mục retention và bằng chứng encryption/key separation. Diễn tập restore đồng bộ DB+file theo RPO/RTO được duyệt.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa–cao · phụ thuộc DBA/vận hành.
- **Tiêu chí kiểm chứng** — Bằng chứng cấu hình gắn artifact, ACL tối thiểu, kết quả khôi phục hợp lệ và diễn tập xóa/retention theo quy trình.

## SEC-022

**Repo thiếu gate bảo mật và kiểm thử ranh giới API** · **Medium** · **Confirmed**

- **Vị trí** — Repository, QLCD.Tests và manifests dependency.
- **Bằng chứng** — Test hiện có chủ yếu nghiệp vụ đơn vị/chuyển với EF InMemory. Không thấy pipeline CI/CD được theo dõi, NuGet lockfile hoặc test tích hợp auth, scope API, file. npm có lock v3; restore cache báo NU1608 cho AutoMapper. Extension DI AutoMapper 12.0.1 đã ngừng bảo trì và yêu cầu AutoMapper 12.0.1, trong khi code khai báo 16.1.1. Chưa chạy build để xác nhận tác động. [Metadata NuGet](https://www.nuget.org/packages/AutoMapper.Extensions.Microsoft.DependencyInjection/12.0.1) · [QLCDTests.cs:18–27](../../backend/QLCD.Tests/QLCDTests.cs#L18-L27) · [QLCDTests.cs:44–65](../../backend/QLCD.Tests/QLCDTests.cs#L44-L65) · [QLCDTests.cs:167–192](../../backend/QLCD.Tests/QLCDTests.cs#L167-L192) · [QLCD.Application.csproj:8–17](../../backend/QLCD.Application/QLCD.Application.csproj#L8-L17) · [package-lock.json:1–15](../../frontend/qlcd-web/package-lock.json#L1-L15)
- **Nguyên nhân gốc** — Thiếu gate được version-control và baseline lock cho backend. Cache restore là dữ liệu cục bộ, cần kiểm tra lại khi build.
- **Điều kiện và khả năng** — Khả năng hồi quy trung bình trong luồng merge/phát hành nếu không có gate bên ngoài. Không có kết luận về CI do tổ chức quản lý riêng.
- **Tác động CIA** — C/I/A gián tiếp qua lỗi lọt bản phát hành.
- **Đối chiếu** — OWASP A03, A08 · NIST SSDF PO.4, PW.7, PW.8, RV.1.
- **Khắc phục** — Gate secret scan, SAST, SCA offline và SBOM, locked restore, test tích hợp SQL + middleware + storage. Xử lý NU1608 và gỡ dependency dư sau test.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P2 · cao · có thể siết điều kiện merge.
- **Tiêu chí kiểm chứng** — Pipeline cho bằng chứng trên commit/artifact, build lặp lại với lockfile, test đã cài đặt bắt hồi quy giả lập và báo người chịu trách nhiệm.

## SEC-023

**Tree và stats có nhánh mặc định mở rộng khi claim thiếu** · **Medium** · **Potential**

- **Vị trí** — GET /api/v1/union-units/tree và /stats.
- **Bằng chứng** — Tree trả root toàn hệ thống nếu tài khoản thường thiếu org hợp lệ. Stats đặt isScoped false khi role trống, controller lấy role/org từ principal. Token do login bình thường phát có role, và các tài khoản tổ seed thấy gán đơn vị. [GetUnionUnitsTreeQuery.cs:116–129](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionUnitsTree/GetUnionUnitsTreeQuery.cs#L116-L129) · [GetUnionStatsQuery.cs:79–116](../../backend/QLCD.Application/Features/UnionUnits/Queries/GetUnionStats/GetUnionStatsQuery.cs#L79-L116) · [UnionUnitsController.cs:60–74](../../backend/QLCD.Api/Controllers/UnionUnitsController.cs#L60-L74) · [LoginCommand.cs:56–62](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L56-L62) · [DbInitializer.cs:438–482](../../backend/QLCD.Infrastructure/Data/DbInitializer.cs#L438-L482)
- **Nguyên nhân gốc** — Phạm vi quyền được triển khai lại tùy path; claim thiếu được coi như nhánh toàn hệ thống trong một số tình huống.
- **Điều kiện và khả năng** — Có khả năng nếu principal xác thực đến với org bị thiếu/sai cho tree hoặc role thiếu cho stats. Chưa có bằng chứng một tài khoản đang phát hành bình thường thỏa điều kiện.
- **Tác động CIA** — C trung bình với cây tổ chức và báo cáo tổng hợp, I/A thấp.
- **Đối chiếu** — CWE-636, CWE-863 · OWASP A01 · API1, API5.
- **Khắc phục** — Dùng chung scope deny-by-default và từ chối claim thiếu/sai. Quyền toàn hệ thống phải được cấp rõ.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P1 · vừa · UI phải xử lý scope không hợp lệ.
- **Tiêu chí kiểm chứng** — Fixture principal hợp lệ thiếu claim không nhận dữ liệu. ADMIN/CDCS chỉ được mở scope theo policy đã duyệt.

## SEC-024

**Mật khẩu dùng SHA-256 nhanh, không salt** · **High** · **Confirmed**

- **Vị trí** — Shared.Security.PasswordHasher, bản trùng Infrastructure, login và reset.
- **Bằng chứng** — Hash gọi SHA256.ComputeHash trực tiếp trên password UTF-8, Verify so sánh chuỗi hex, không có salt hoặc cost thích nghi. Login dùng bản Shared. [PasswordHasher.cs:9–19](../../backend/QLCD.Shared/Security/PasswordHasher.cs#L9-L19) · [PasswordHasher.cs:9–19](../../backend/QLCD.Infrastructure/Security/PasswordHasher.cs#L9-L19) · [LoginCommand.cs:40–49](../../backend/QLCD.Application/Features/Auth/Commands/Login/LoginCommand.cs#L40-L49) · [AccountsController.cs:75–82](../../backend/QLCD.Api/Controllers/AccountsController.cs#L75-L82)
- **Nguyên nhân gốc** — Tự triển khai hash mật khẩu bằng hash đa dụng và giữ hai bản logic.
- **Điều kiện và khả năng** — Khả năng cao khi người có quyền lấy hash lịch sử hoặc audit và mật khẩu yếu/phổ biến. Rủi ro còn lại sau khi bỏ trường plaintext.
- **Tác động CIA** — C cao đối với credential, I cao qua chiếm tài khoản, A gián tiếp.
- **Đối chiếu** — CWE-759, CWE-916 · OWASP A04, A07 · API2.
- **Khắc phục** — Dùng Argon2id hoặc PBKDF2 theo policy, salt riêng, hash theo version và verify thư viện. Reset bắt buộc tài khoản đã phơi nhiễm; rehash-on-login cho phần legacy còn đủ căn cứ.
- **Ưu tiên, độ phức tạp, ảnh hưởng** — P0 cùng SEC-002 · vừa–cao · cần chuyển hash/reset.
- **Tiêu chí kiểm chứng** — Fixture hai tài khoản cùng mật khẩu sinh hash khác nhau; luồng đổi/rehash và giới hạn tài nguyên của KDF theo ngân sách; hash cũ bị loại đúng hạn.

## Xác thực và truy cập chưa đăng nhập

Login là action public có chủ ý. Download bỏ yêu cầu xác thực ở metadata của action nhưng scope rỗng chặn trả nội dung cho anonymous bình thường, với khác biệt mã lỗi đã nêu. Các action CRUD khác có Authorize ở controller hoặc ở action; rà soát tĩnh không thấy action CRUD bình thường mở trực tiếp với anonymous. Rủi ro xác thực chính là độ tin cậy của khóa ký (SEC-001), bootstrap (SEC-004) và vòng đời phiên (SEC-011). Mọi khả năng truy cập trái quyền do danh tính hoặc scope sai vẫn phụ thuộc các điều kiện nêu từng mục. [Bản đồ 42 action](01-codebase-overview.md#bề-mặt-api-tại-snapshot)

## Giới hạn bằng chứng cho các nhóm injection

| Nhóm | Kết quả đọc mã và phần cần xác minh |
| --- | --- |
| SQL injection | Trên đường truy vấn đại diện, input search/filters đi vào biểu thức LINQ EF và các tham chiếu ID được bind kiểu. Tìm kiếm tĩnh không cho thấy FromSqlRaw/ExecuteSqlRaw trong API/Application. Cần kiểm tra các package, SQL script ngoài repo và query plan trước khi kết luận cho hệ thống thực tế. [GetUnionMembersQuery.cs:63–108](../../backend/QLCD.Application/Features/UnionMembers/Queries/GetUnionMembers/GetUnionMembersQuery.cs#L63-L108) · [GetFinanceQuery.cs:57–104](../../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs#L57-L104) |
| NoSQL / command injection | Provider ứng dụng ghi nhận SQL Server hoặc EF InMemory. Không thấy request đưa vào shell trong API/Application; script scratch là công cụ riêng và không được chạy. [DependencyInjection.cs:19–57](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L19-L57) · [test_db.py:29–50](../../frontend/qlcd-web/scratch/test_db.py#L29-L50) |
| XSS / SSRF | Điểm URL chứng chỉ cần kiểm tra, dữ liệu tên và text phần lớn render qua JSX. Không thấy cơ chế backend fetch URL do người dùng điều khiển trong các module đã đọc. Feature/runtime tối ưu ảnh Next và điều kiện advisory được theo dõi riêng. [SEC-019](#sec-019) · [SEC-012](#sec-012) |
| CSRF | Browser chủ động gắn Authorization từ Web Storage, không thấy API lấy credential từ cookie ứng dụng. CSRF cookie truyền thống ít phù hợp với luồng hiện có; khi chuyển BFF cookie phải có CSRF cho phương thức thay đổi trạng thái. [api.ts:8–19](../../frontend/qlcd-web/src/lib/api.ts#L8-L19) · [Program.cs:19–35](../../backend/QLCD.Api/Program.cs#L19-L35) |
| Deserialization / over-posting | JSON của API bind DTO/command và dùng enum converter. Không thấy polymorphic type activation tự cấu hình; ghi trạng thái duyệt và phạm vi tham chiếu thuộc SEC-006/007. Kiểm enum, collection depth và DTO theo role trong giai đoạn hardening. [Program.cs:41–46](../../backend/QLCD.Api/Program.cs#L41-L46) · [EmulationCommands.cs:180–190](../../backend/QLCD.Application/Features/Emulations/Commands/EmulationCommands.cs#L180-L190) · [WelfareCommands.cs:144–152](../../backend/QLCD.Application/Features/Welfare/Commands/WelfareCommands.cs#L144-L152) |
| Đường dẫn / upload | Input tới filesystem đã xác nhận trong SEC-008. Giới hạn và kiểm nội dung trình bày ở SEC-015. [SEC-008](#sec-008) · [SEC-015](#sec-015) |

## Chi tiết đối chiếu dependency

| Gói / thành phần | Mốc bản vá theo tài liệu đã đối chiếu | Điều kiện cần kiểm tra |
| --- | --- | --- |
| Next 16.2.9 + sharp 0.34.5 | GHSA-2464-fhr4-w9xw có bản vá 16.4.1 trên dòng 16. Advisory sharp yêu cầu 0.35.5 trở lên với binary dựng sẵn tương ứng. Chọn bản hiện hành còn hỗ trợ khi triển khai. | Khớp lockfile cả sharp và package tùy chọn Linux x64. Xác minh OS glibc, binary native được cài và optimizer ở ingress. Không suy ra RCE đã xảy ra. [package-lock.json:5507–5538](../../frontend/qlcd-web/package-lock.json#L5507-L5538) · [package-lock.json:6336–6350](../../frontend/qlcd-web/package-lock.json#L6336-L6350) · [package-lock.json:864–869](../../frontend/qlcd-web/package-lock.json#L864-L869) · [Vercel](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) · [sharp](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w) |
| Next 16.2.9 · kiểm điều kiện theo tính năng | GHSA-6gpp-xcg3-4w24 và GHSA-m99w-x7hq-7vfj ghi mốc 16.2.11 cho hai lỗi cụ thể. | Không thấy cấu hình middleware/Proxy i18n tương ứng hoặc Server Action trong mã; đối chiếu artifact nếu có tích hợp build. Mốc này không bao phủ advisory mới hơn. [next.config.ts:1–7](../../frontend/qlcd-web/next.config.ts#L1-L7) · [Vercel Proxy](https://github.com/vercel/next.js/security/advisories/GHSA-6gpp-xcg3-4w24) · [Vercel Server Actions](https://github.com/vercel/next.js/security/advisories/GHSA-m99w-x7hq-7vfj) |
| Axios 1.18.0 | GHSA-542g-h47m-68v8 ghi bản vá từ 1.20.0. | Luồng chính quan sát là client Axios ở trình duyệt, chưa thấy dùng Node HTTP/2 trong feature. Kiểm bundle và adapter production. [package-lock.json:2646–2657](../../frontend/qlcd-web/package-lock.json#L2646-L2657) · [api.ts:1–19](../../frontend/qlcd-web/src/lib/api.ts#L1-L19) · [Axios](https://github.com/axios/axios/security/advisories/GHSA-542g-h47m-68v8) |
| SqlClient 5.1.1, Azure.Identity 1.7.0 trong cache NuGet | SqlClient 5.1.3 vá CVE-2024-0056. SqlClient 5.1.4 nâng Azure.Identity cho CVE-2023-36414. | Cache cục bộ cho thấy EF SQL Server kéo SqlClient rồi Azure.Identity. Đối chiếu SBOM phát hành và kiểu xác thực SQL; chưa thấy app gọi Azure.Identity trực tiếp. [QLCD.Infrastructure.csproj:10–20](../../backend/QLCD.Infrastructure/QLCD.Infrastructure.csproj#L10-L20) · [DependencyInjection.cs:23–55](../../backend/QLCD.Infrastructure/DependencyInjection.cs#L23-L55) · [Microsoft SQL client release notes](https://github.com/MicrosoftDocs/sql-docs/blob/live/docs/connect/ado-net/microsoft-data-sql-client-release-notes.md) |
| .NET 8 | Đã hết hỗ trợ 10/11/2026 theo Microsoft. | Xác minh runtime container/host và lên lộ trình .NET 10 LTS. [QLCD.Api.csproj:3–16](../../backend/QLCD.Api/QLCD.Api.csproj#L3-L16) · [Microsoft lifecycle](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core) |

Danh sách này là đối chiếu chọn lọc. Toàn bộ gói trực tiếp và bắc cầu cần SCA trên graph của artifact, advisory feed cập nhật và quy trình xác minh reachability.
