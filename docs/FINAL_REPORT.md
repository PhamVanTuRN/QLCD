# Báo cáo hoàn thiện QLCD

Ngày 25/11/2026. **Mức sẵn sàng hiện tại là Testing Ready.** Backend và frontend build, các luồng nghiệp vụ cốt lõi đã chọn chạy qua, và migration đã được thử trên SQL Server Express. Nghiệm thu staging và production còn phụ thuộc môi trường đích và phần nghiệp vụ cần phê duyệt.

## Đường cơ sở và phạm vi

Điểm bắt đầu là working tree có sẵn đợt hardening ngày 23/11/2026. Repo dùng Next.js, React, Tailwind CSS, ASP.NET Core, MediatR, EF Core và SQL Server. Đường cơ sở build được, 9/9 xUnit và HTTP smoke qua. Lint có 86 lỗi và 19 cảnh báo. UI kiểm tra ở 13 trang có 23 trường hợp tràn ngang cấp trang. Màn hình chất lượng dùng dữ liệu mẫu. Script migration idempotent lỗi trên SQL Server Express trống. [Kiến trúc và quyền hiện hành](PROJECT_OVERVIEW.md) · [Phát hiện và ưu tiên](PROJECT_AUDIT.md)

## Điểm chất lượng trước và sau

Điểm là đánh giá kỹ thuật của đợt này trên thang 100. Mỗi dòng ghi số điểm đã đạt trên trọng số tối đa. Điểm chưa đạt phản ánh kiểm soát còn thiếu hoặc chưa có bằng chứng nghiệm thu.

| Hạng mục | Tối đa | Trước | Sau | Căn cứ |
| --- | ---: | ---: | ---: | --- |
| Chức năng và nghiệp vụ | 20 | 11 | 17 | Sửa PUT, tổ hợp lệ, lịch sử tiếp nhận/chuyển, tổng tài chính, tra cứu đoàn viên và báo cáo năm. Các workflow mở rộng còn chờ duyệt. |
| UI/UX | 20 | 8 | 17 | Tràn ngang 23 → 0 trên 91 ảnh mỗi lượt. Điều hướng mobile, dialog bàn phím, focus, nhãn và axe qua các trang đã quét. Cần nghiệm thu screen reader và thiết bị thật. |
| Chất lượng mã | 15 | 8 | 13 | ESLint 86 lỗi/19 cảnh báo → 0/0. DTO có kiểu, hủy query cũ và component loading/dialog dùng chung. Biểu mẫu theo module vẫn còn CSS cục bộ. |
| Bảo mật | 20 | 14 | 17 | Kế thừa phiên HttpOnly, CSRF và scope. Sửa DTO thi đua, kiểm quyền và PDF, xác minh migration credential trên SQL. Hạ tầng đích còn chờ. |
| Hiệu năng | 10 | 5 | 7 | Dashboard giảm 37,3% JavaScript nén trong phép đo cục bộ. Tổng hợp SQL, debounce và tách lookup. Cần số liệu tải thực. |
| Kiểm thử | 10 | 5 | 9 | 12 xUnit qua lần chạy mặc định, ca SQL riêng chạy qua cùng ba kiểm tra báo cáo, HTTP smoke và 12 nhóm kiểm tra browser. Còn các kịch bản hạ tầng, tải và browser khác. |
| Tài liệu và triển khai | 5 | 3 | 4 | Có cấu hình mẫu, README, AGENTS.md, tám skill, báo cáo và gate CI. Chưa có bằng chứng run staging hoặc CI từ xa. |
| **Tổng** | **100** | **54** | **84** | Đánh giá cho code và môi trường thử nghiệm đã kiểm chứng. |

## Các thay đổi đã giao

- Tạo và chuyển đoàn viên kiểm tổ đang hoạt động. Hồ sơ mới ghi biến động tiếp nhận. Trang chi tiết hiển thị tối đa 50 biến động trong phạm vi. Yêu cầu chuyển trùng đồng thời giữ một kết quả và một dòng lịch sử.
- Lệnh PUT dùng ID khớp route. Các màn hình xem, viết và duyệt hiển thị hành động theo role. Tra cứu thành viên theo tên hoặc mã nhân viên trên máy chủ.
- Tài chính tổng hợp theo bộ lọc và phạm vi trước phân trang. Trang Tổng hợp thi đua lấy số liệu đã lưu theo năm. Dashboard đo theo phạm vi và ghi nhận tháng theo giờ Việt Nam.
- Điều hướng mobile, native dialog và trạng thái tải/lỗi/không quyền. Biểu đồ tổng quan nhẹ hơn, giữ số liệu bằng văn bản. Tải PDF hiển thị lỗi và giữ tệp khi thao tác xóa thất bại.
- Xác minh migration hardening trên schema trống và schema cũ tổng hợp. Sửa tham chiếu cột trong SQL idempotent, giữ nguyên ID migration và EF model. SQL xác nhận rollback khi phát hiện phiên sửa cũ.
- Sửa việc trả mã nhân viên không khớp scope trong thi đua. Bổ sung cách nhận khóa MediatR qua cấu hình bí mật. Giữ quyền API, TLS SQL, CSRF và hạn mức của đợt hardening.

Các tệp chính gồm [AppShell](../frontend/qlcd-web/src/components/AppShell.tsx), [useResource](../frontend/qlcd-web/src/lib/use-resource.ts), [API client](../frontend/qlcd-web/src/lib/api.ts), [hồ sơ đoàn viên](../frontend/qlcd-web/src/app/members/page.tsx), [tổng hợp thi đua](../backend/QLCD.Application/Features/Emulations/Queries/GetEmulations/GetEmulationSummaryQuery.cs), [tài chính](../backend/QLCD.Application/Features/Finance/Queries/GetFinance/GetFinanceQuery.cs), [migration hardening](../backend/QLCD.Infrastructure/Migrations/20261123101155_HardenAuthenticationAndEvidence.cs) và [CI](../.github/workflows/security.yml).

## Kết quả kiểm thử

| Lệnh hoặc kiểm tra | Kết quả |
| --- | --- |
| `dotnet restore backend/QLCD.sln --locked-mode -p:NuGetAuditMode=all` | Qua. |
| `dotnet build backend/QLCD.sln --no-restore` và cấu hình Release | Qua, 0 lỗi và 0 cảnh báo build. |
| `dotnet test backend/QLCD.sln --no-build --no-restore` | 12 qua, 0 lỗi, 1 ca SQL chạy trong lượt riêng. |
| `node tools/test-security-smoke.mjs` | Qua. Phiên, đổi/reset mật khẩu, vai trò, phân trang, quyền tệp và hai yêu cầu chuyển đồng thời. |
| `./tools/test-sql.ps1` | Qua. Hai database tổng hợp sạch/cũ, chạy lại script, 4/4 kiểm tra truy vấn/rollback SQL. SQL Express loopback dùng chứng thư dev tự ký trong script kiểm thử. Runtime API giữ xác thực chứng thư. |
| `dotnet ef migrations has-pending-model-changes` | Không có model drift. EF CLI 10.0.10 ghi cảnh báo chênh phiên bản EF runtime 10.0.15. |
| API Testing trỏ tới SQL không phản hồi trên loopback | Liveness trả 200 và readiness trả 503. |
| `npm ci`, `npm run lint -- --max-warnings 0`, `npm run build`, `npm run typecheck` | Qua, lint 0 lỗi và 0 cảnh báo. |
| `npm run test:browser` | Qua trên Chromium với frontend production build và API Testing. 91 ảnh sau trên 13 route ở 360, 390, 768, 1024, 1280, 1440, 1920 px. 0 tràn ngang cấp trang, 0 lỗi JavaScript và 0 lỗi API ngoài dự kiến. 0 phát hiện axe ở 13 trang của lượt sau. |
| OSV Scanner ở chế độ offline | Không báo advisory khớp lockfile npm/NuGet trong bản catalog tải ngày 23/11/2026. |

Mười hai nhóm browser gồm tạo/sửa danh mục, trang từ chối quyền, điều hướng mobile và back/forward, tạo/chuyển/sửa đoàn viên và lưu hai ngoại ngữ, tạo/sửa hoạt động kèm PDF và double-click, tạo/sửa giao dịch, đề xuất/duyệt phúc lợi, đăng ký sáng kiến, ghi kết quả thi đua, tổng hợp năm có và không có dữ liệu, thử lại khi mất mạng và quay về đăng nhập sau thu hồi phiên. [Mã kiểm thử](../frontend/qlcd-web/tests/browser.mjs) · [Smoke SQL](../tools/test-sql.ps1)

Ảnh và JSON nằm trong workspace tại `artifacts/browser/before` và `artifacts/browser/after`. Mỗi thư mục có `report.json`. Trong ba lượt Chromium với context mới, 1440 × 960, cùng máy và dữ liệu tổng hợp, Dashboard tải **265.444 → 166.511 byte** JavaScript nén. Trung vị `domInteractive` là 52 → 68 ms trong phép đo loopback ba lượt. Số liệu LCP, INP, CLS phân vị 75, tải SQL và độ trễ từ người dùng thật vẫn cần đo.

## Quyết định và phần còn mở

- Giữ kiến trúc hiện có, hợp đồng API v1 và dữ liệu đã lưu. API bổ sung `totals` cho tài chính, `lichSuBienDong` cho hồ sơ và `trangThai` cho cây tổ chức.
- Dùng kết quả thi đua đã ghi nhận để thay mẫu chất lượng. Bộ tiêu chí xếp loại cấp tổ chức, kỳ theo quý và quy trình phê duyệt chính thức cần xác nhận.
- Áp quy tắc tài liệu cho hồ sơ mới và đích chuyển. Hồ sơ lịch sử gán trực tiếp đơn vị cấp trên có thể được sửa và chuyển về tổ qua luồng hiện tại. Phần lưu biến động cho các thao tác ngoài tiếp nhận và chuyển nội bộ cần nghiệp vụ cụ thể.
- Cần phê duyệt nghiệp vụ cho tự phục vụ đoàn viên, tiếp nhận hai cấp, chuyển ngoài bệnh viện, bảng lương, xuất biểu mẫu chính thức, báo cáo và thông báo theo quy trình. [Theo dõi vấn đề](TASK_TRACKER.md)
- Nghiệm thu staging cần xác nhận TLS SQL qua API, ingress HTTPS, MFA và hết hạn theo thời gian thực, ClamAV và tệp cũ, backup/restore, quyền runtime, CI từ xa và license MediatR. Trước cutover, diễn tập nâng dữ liệu, xoay credential cũ và xác minh phương án phục hồi. [Runbook](security-audit/08-remediation-status.md) · [Hướng dẫn MediatR](https://github.com/LuckyPennySoftware/MediatR#setting-the-license-key)

Workspace giữ nguyên dữ liệu thật và lịch sử Git. Kiểm thử dùng dữ liệu tổng hợp, và chưa có triển khai production. Mức **Testing Ready** áp dụng cho các luồng đã kiểm chứng, với các điều kiện staging/production ghi ở trên.

## Kết quả nghiệm thu local mới nhất

- Phiên `http://127.0.0.1:3003` chạy với SQL Server Express và database riêng `QLCD_Local`. Đã kiểm chứng tiếp nhận trực tiếp tại CĐBP đang hoạt động chưa có tổ, mở lại hồ sơ sau khi API khởi động lại và tìm tài khoản theo đơn vị trước phân trang.
- Giao diện dùng xanh cô-ban và nền sáng. Bản hiện tại qua 17 luồng Playwright, gồm kiểm tra bảng và biểu mẫu ở 7 chiều rộng. Axe không ghi nhận vi phạm trên các trang đã quét. Backend qua 14 xUnit mặc định và 6 ca truy vấn trên SQL Express.
- Đã thử nâng schema cũ có dữ liệu mẫu, sao lưu với checksum, khôi phục sang database riêng và kiểm tra lịch sử kết nạp sau phục hồi. Phục hồi đồng bộ tệp và key ring, xác thực MFA, quyền hạ tầng đích và nghiệp vụ mở rộng còn chờ nghiệm thu. [Kết quả từng đợt](TASK_TRACKER.md)
