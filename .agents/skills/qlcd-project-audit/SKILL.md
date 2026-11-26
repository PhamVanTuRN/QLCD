---
name: qlcd-project-audit
description: >-
  Rà soát hiện trạng QLCD theo nhiều phân hệ, xác lập đường cơ sở, ưu tiên P0–P3 và cập nhật tiến độ.
---

# Quy trình


1. Đọc [AGENTS](../../../AGENTS.md), [tổng quan](../../../docs/PROJECT_OVERVIEW.md) và [tiến độ](../../../docs/TASK_TRACKER.md). Dùng [kiểm kê ban đầu](../../../docs/PROJECT_AUDIT.md) khi cần so sánh lịch sử. Đối chiếu working tree với Git để nhận diện thay đổi đã có.
2. Ghi đường cơ sở theo SDK, provider, vai trò, trang, dữ liệu thử và mốc migration quan sát được. Đối chiếu nghiệp vụ với UI, API, handler và dữ liệu. Gắn ngày cho số liệu và xác định môi trường của bằng chứng.
3. Ưu tiên chặn mất dữ liệu, sai quyền và lỗi luồng chính. Ghi kết quả và yêu cầu chờ quyết định trong `TASK_TRACKER.md`. Dùng [báo cáo bảo mật hiện hành](../../../docs/security-audit/SECURITY_AUDIT.md) khi đối chiếu rủi ro và điều kiện phát hành.

# Kiểm tra

- [ ] Có bằng chứng trước và sau cho các phát hiện ưu tiên.
- [ ] Có lệnh tái kiểm tra và tiêu chí hoàn thành.
- [ ] Mỗi phần còn mở có nguyên nhân và chủ thể cần xác nhận.
