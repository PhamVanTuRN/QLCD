# Báo cáo kiểm toán bảo mật QLCD

Đợt kiểm duyệt ngày 26/11/2026 dùng working tree hiện tại và đối chiếu lại các thay đổi xác thực. [Báo cáo kiểm duyệt hiện hành](SECURITY_AUDIT.md) · [Bảo vệ dữ liệu](DATA_PROTECTION.md) · [Ứng phó sự cố](INCIDENT_RESPONSE.md)

## Đường cơ sở lịch sử

Các phát hiện bên dưới mô tả snapshot trước hardening. Mã và số dòng đã thay đổi trong các đợt khắc phục. [Tình trạng khắc phục và hướng dẫn triển khai](08-remediation-status.md)

Đợt cải tiến ngày 25/11/2026 xác minh lại migration hardening trên SQL Server Express, phạm vi các báo cáo và luồng trình duyệt. [Báo cáo nghiệm thu theo mốc](../FINAL_REPORT.md)

**Đánh giá tĩnh ngày 23/11/2026** · Nhánh `main`, commit nền `b9e38b2` và thay đổi đã có trong working tree lúc rà soát.

**Rủi ro tổng thể cao.** Hai phát hiện Critical nằm ở chuỗi xác thực: khóa ký JWT tĩnh trong mã và mật khẩu nguyên văn được lưu, đưa qua API quản trị và UI. Quyền nghiệp vụ theo đơn vị, quan hệ tệp minh chứng, cách xử lý khi SQL lỗi và dependency cần xử lý song song. Mức phơi nhiễm production chưa được xác minh. Nếu artifact đang chạy dùng khóa/credential có trong repo, ưu tiên vô hiệu hóa giá trị cũ, thu hồi phiên và kiểm kê nơi dữ liệu được sao chép. [SEC-001](03-security-findings.md#sec-001) · [SEC-002](03-security-findings.md#sec-002) · [SEC-003](03-security-findings.md#sec-003) · [SEC-009](03-security-findings.md#sec-009) · [SEC-012](03-security-findings.md#sec-012)

## Phân bố phát hiện

| Mức độ | Confirmed | Potential | Needs Verification | Tổng |
| --- | ---: | ---: | ---: | ---: |
| Critical | 2 | 0 | 0 | 2 |
| High | 11 | 1 | 0 | 12 |
| Medium | 6 | 2 | 1 | 9 |
| Low | 1 | 0 | 0 | 1 |
| Informational | 0 | 0 | 0 | 0 |
| **Tổng** | **20** | **3** | **1** | **24** |

Confirmed xác nhận hành vi hoặc khoảng trống trong mã/manifest, không xác nhận sự cố hay việc ứng dụng đã bị xâm nhập. Phiên bản dependency khớp advisory được ghi rõ cùng điều kiện runtime chưa xác minh. Các phát hiện không có dữ liệu đầy đủ về triển khai dùng mức độ định tính. [Phương pháp và bằng chứng](03-security-findings.md)

## 10 vấn đề ưu tiên

| Ưu tiên | Phát hiện | Mức | Hành động |
| ---: | --- | --- | --- |
| 1 | [SEC-001](03-security-findings.md#sec-001) · Khóa ký JWT tĩnh trong mã nguồn | Critical | Xoay khóa, vô hiệu hóa khóa cũ và yêu cầu đăng nhập lại. |
| 2 | [SEC-002](03-security-findings.md#sec-002) · Mật khẩu nguyên văn lưu trong SQL và trả qua API quản trị | Critical | Dừng lưu/trả plaintext, cấp lại credential và hủy phiên. |
| 3 | [SEC-003](03-security-findings.md#sec-003) · Credential kết nối SQL nằm trong cấu hình được Git theo dõi | High | Xoay credential SQL, ép kiểm chứng chứng thư và hạn chế quyền runtime. |
| 4 | [SEC-004](03-security-findings.md#sec-004) · Tài khoản seed và tài khoản tạo đơn vị có mật khẩu dự đoán được | High | Tách seed demo và chuyển sang kích hoạt một lần. |
| 5 | [SEC-006](03-security-findings.md#sec-006) · Kiểm tra đơn vị chưa bao phủ quyền chức năng và quyền tự xem hồ sơ | High | Chốt policy theo chức năng và theo hồ sơ cá nhân. |
| 6 | [SEC-005](03-security-findings.md#sec-005) · Gắn minh chứng thay đổi chủ sở hữu mà không phân quyền tệp | High | Kiểm quyền trên minh chứng gốc và ghi liên kết nguyên tử. |
| 7 | [SEC-007](03-security-findings.md#sec-007) · Tham chiếu đoàn viên và đơn vị vượt ranh giới trong tài chính, thi đua | High | Ràng buộc đoàn viên/đơn vị trước khi ghi, thống nhất scope đọc. |
| 8 | [SEC-008](03-security-findings.md#sec-008) · Đường dẫn lưu PDF chịu ảnh hưởng của đầu vào chưa ràng buộc | High | Giới hạn module/storage root và kiểm soát ACL. |
| 9 | [SEC-009](03-security-findings.md#sec-009) · Fallback InMemory và migration/seed trong startup làm mờ lỗi production | High | Bỏ fallback production, dùng readiness và job migrate riêng. |
| 10 | [SEC-012](03-security-findings.md#sec-012) · Dependency thuộc dải advisory và .NET 8 đã hết hỗ trợ | High | Kiểm artifact, cập nhật Next/sharp, SqlClient và lộ trình .NET 10. |

**Quick wins** gồm xoay khóa ký và SQL, bỏ mật khẩu nguyên văn khỏi danh sách quản trị, chặn ghi credential vào audit, tắt seed demo, từ chối module file ngoài allowlist, xác minh HTTPS/Swagger ở ingress và thu hẹp đường optimizer nếu không dùng. Đưa chuyển đổi hash vào cùng đợt reset. Xử lý thu hồi phiên dài hạn ngay sau đợt vô hiệu hóa ban đầu. [SEC-010](03-security-findings.md#sec-010) · [SEC-011](03-security-findings.md#sec-011) · [SEC-013](03-security-findings.md#sec-013) · [SEC-024](03-security-findings.md#sec-024)

## Phạm vi và giới hạn

- Đã đọc mã ASP.NET Core, Application/Domain/Shared, EF DbContext/migrations/seed, scope/audit, Next.js, lockfiles và test. Đã kiểm kê 42 action thuộc 11 controller, đối chiếu tài liệu quyền và khảo sát điểm vào file/API/SQL cùng cấu hình trong repo. [Tổng quan](01-codebase-overview.md)
- Đánh giá bằng đọc mã và truy vấn metadata cục bộ. Không khởi chạy ứng dụng, không chạy test kết nối/khai thác, build/restore, migration, seed, cài package hay truy cập SQL/dữ liệu thật. Một lượt trích xuất ban đầu chưa che một literal khóa ký từ mã; báo cáo chỉ dẫn vị trí của khóa và không chứa giá trị đó. Dependency đối chiếu chọn lọc với advisory công khai, không gửi repo, lockfile hoặc dữ liệu ứng dụng tới dịch vụ ngoài. Cache restore NuGet không chứng minh graph production. [SEC-012](03-security-findings.md#sec-012)
- Chưa xác minh runtime, TLS/ACL và cấu hình edge, quyền tài khoản thực tế, giá trị bí mật còn hiệu lực, backup/restore, retention, production SBOM và pipeline do tổ chức quản lý ngoài repo. Không tìm thấy deployment manifest để đánh giá container root/K8s/firewall. Kết quả không thay thế đánh giá vận hành hoặc chứng nhận tuân thủ. [Bằng chứng cần bổ sung](07-security-checklist.md#bằng-chứng-cần-thu-từ-vận-hành)

## Kiến trúc mục tiêu và lộ trình

Giữ backend monolith phân lớp và Next.js. Thêm policy hành động + kiểm quyền đối tượng, phiên ngắn có thu hồi, SQL fail closed và riêng job DDL, kho minh chứng riêng tư, audit theo sự kiện, và CI bảo mật có SBOM. Có thể đưa web/API về cùng origin HTTPS và dùng BFF cho phiên theo quyết định triển khai. [Sơ đồ mục tiêu](05-security-recommendations.md#kiến-trúc-mục-tiêu)

1. **Xử lý khẩn cấp** · Xoay credential, bảo vệ dữ liệu và minh chứng, khóa fallback, kiểm bản vá/triển khai.
2. **Hardening** · Chuẩn hóa phiên, quyền, validation, error, audit, dữ liệu và storage.
3. **Cải tiến kiến trúc** · Củng cố module và transaction, release phân quyền, storage dùng chung và nền tảng được hỗ trợ.
4. **Kiểm thử và giám sát** · Gate CI, cảnh báo, diễn tập khôi phục và bằng chứng nghiệm thu. [Kế hoạch và rollback](06-remediation-roadmap.md)

## Tài liệu

| Tài liệu | Nội dung |
| --- | --- |
| [01 · Tổng quan codebase](01-codebase-overview.md) | Công nghệ, sơ đồ kiến trúc, trust boundary, API và triển khai |
| [02 · Đánh giá kiến trúc](02-architecture-review.md) | Phân lớp, DI, validation, transaction và quyền dữ liệu |
| [03 · Phát hiện bảo mật](03-security-findings.md) | 24 phát hiện với phân loại, vị trí, bằng chứng và nghiệm thu |
| [04 · Threat model](04-threat-model.md) | DFD, tài sản/tác nhân, trust boundary và STRIDE |
| [05 · Khuyến nghị](05-security-recommendations.md) | Biện pháp kỹ thuật, kiến trúc mục tiêu, ASVS, SSDF và ISO |
| [06 · Lộ trình](06-remediation-roadmap.md) | Ưu tiên, module, cách kiểm thử, phụ thuộc, rollback |
| [07 · Checklist](07-security-checklist.md) | Kiểm chứng sau khắc phục và bằng chứng vận hành |
