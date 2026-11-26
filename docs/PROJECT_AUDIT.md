# Rà soát ứng dụng và ưu tiên

> Kiểm kê ngày 25/11/2026. Các thay đổi và kết quả xác minh sau mốc này được ghi trong [TASK_TRACKER](TASK_TRACKER.md) và [báo cáo bảo mật hiện hành](security-audit/SECURITY_AUDIT.md).

Ngày 25/11/2026. Đường cơ sở là working tree đầu phiên, sau đợt hardening có sẵn. Đối chiếu tài liệu nghiệp vụ với route, handler và schema. Thử trên ASP.NET Core Testing, SQL Server Express cô lập và Chromium headless. [Đợt hardening trước](security-audit/08-remediation-status.md)

| Ưu tiên | Phát hiện | Xử lý |
| --- | --- | --- |
| P0 | Script idempotent lỗi khi SQL biên dịch tham chiếu cột mới, chặn nâng schema và vô hiệu hóa credential cũ. | Hoãn phân giải câu SQL đến khi migration guard chạy. Thử schema trống và schema cũ có tài khoản, audit tổng hợp. |
| P1 | UI gửi PUT thiếu ID cho danh mục và các module nghiệp vụ. | API client gắn ID từ route. |
| P1 | DTO cây thiếu trạng thái đơn vị. Một số màn hình dựa vào trường này. | Bổ sung `trangThai`. Tạo và chuyển đoàn viên sử dụng tổ hoạt động. |
| P1 | EF InMemory có thể ghi lịch sử dư khi hai yêu cầu chuyển cùng cập nhật một đoàn viên. | Tuần tự hóa chuyển trên InMemory. Kiểm thử SQL xác nhận dòng lịch sử thừa được rollback khi concurrency token phát hiện thay đổi cũ. |
| P1 | Trang chất lượng dùng số liệu tĩnh. Tổng thu chi lấy từ một trang. | Tổng hợp thi đua theo năm và phạm vi. Tính thu chi từ SQL trước phân trang. |
| P1 | DTO thi đua trả mã nhân viên khi thông tin người đó bị giới hạn vì chuyển đơn vị. | Áp cùng điều kiện hiển thị ID, họ tên và mã nhân viên. |
| P1 | Tên đơn vị dài hợp lệ có thể làm tên hiển thị tài khoản vượt schema. | Dùng tên hiển thị ngắn khi vượt giới hạn. |
| P1 | Danh sách liên quan chỉ đọc 100 đoàn viên đầu. | Tra cứu theo tên/mã và phạm vi. Form dùng đơn vị đã chọn hoặc đơn vị của đoàn viên. |
| P1 | Tìm kiếm tài khoản chỉ lọc các dòng của trang hiện tại. | Lọc ở SQL trước phân trang, kiểm tra tên người dùng, tên quản lý và tên đơn vị. |
| P2 | Sidebar cố định, modal tràn, trường nhập thiếu nhãn và chữ thiếu tương phản. | Điều hướng mobile, native dialog, label và focus. Duy trì vùng cuộn cho bảng rộng. |
| P2 | Có 86 lỗi và 19 cảnh báo lint. Bộ lọc tải lại nhiều lookup và có thể vẽ kết quả cũ. | Kiểu TypeScript, hủy request, debounce, lỗi và retry. Tách tải lựa chọn biểu mẫu. |
| P2 | Tổng quan có bundle biểu đồ lớn và hiện số 0 khi lỗi. | Biểu đồ nhẹ, trạng thái tải/lỗi, nhóm thống kê tháng và tổ theo phạm vi. |
| P3 | Tài liệu cũ mô tả cả workflow dự kiến. | Bổ sung tổng quan theo mã và liên kết hiện hành. |

## Các mốc nghiệm thu còn lại

- Chủ nghiệp vụ duyệt quy trình phê duyệt hai cấp, chuyển ngoài bệnh viện, tự phục vụ, biểu mẫu Excel/PDF, mã tiêu chí và thang xếp loại chính thức. Trang tổng hợp dùng kết quả thi đua hiện có. Quy tắc tiếp nhận trực tiếp tại CĐBP chưa có tổ đã được xác nhận và triển khai.
- Staging cần ingress, quyền SQL, chứng thư, máy quét, key ring, MFA và kế hoạch xoay bí mật. Đã kiểm chứng phục hồi database mẫu trên SQL Express. Trước khi cập nhật dữ liệu thật, diễn tập phục hồi đồng bộ trên hạ tầng đích.
- Nghiệm thu cần tải và dữ liệu đại diện, screen reader, thiết bị thật, telemetry và hành vi mất kết nối SQL qua ingress.

Đối chiếu bảo mật theo nhóm kiểm soát và hiện trạng rà soát. Minh chứng production và kết luận tuân thủ chờ nghiệm thu. [OWASP Top 10 2025](https://owasp.org/projects/Top-Ten) · [OWASP API Security Top 10](https://api-security.owasp.org/) · [OWASP ASVS 5.0](https://asvs.owasp.org/)
