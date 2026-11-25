---
name: qlcd-project-audit
description: >-
  Rà soát hiện trạng QLCD theo nhiều phân hệ, xác lập đường cơ sở, ưu tiên P0–P3 và cập nhật tiến độ.
---

# Quy trình


1. Đọc AGENTS.md, docs/PROJECT_OVERVIEW.md và docs/PROJECT_AUDIT.md từ gốc repo. So sánh working tree với Git để phân biệt thay đổi đã có và phần sửa mới.
2. Ghi đường cơ sở theo SDK, provider, vai trò, trang và dữ liệu thử. Đối chiếu từng nghiệp vụ với tài liệu và hành vi UI/API có thể chạy.
3. Ưu tiên chặn mất dữ liệu, sai quyền và lỗi luồng chính. Đánh dấu yêu cầu còn chờ quyết định ở TASK_TRACKER.md.

# Kiểm tra

- [ ] Có bằng chứng trước và sau cho các phát hiện ưu tiên.
- [ ] Có lệnh tái kiểm tra và tiêu chí hoàn thành.
- [ ] Mỗi phần còn mở có nguyên nhân và chủ thể cần xác nhận.
