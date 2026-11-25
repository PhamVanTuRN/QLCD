---
name: qlcd-backend
description: >-
  Sửa endpoint, handler MediatR, validation hoặc quy tắc nghiệp vụ QLCD.
---

# Quy trình


1. Đọc docs/PROJECT_OVERVIEW.md và quy tắc nghiệp vụ liên quan. Kiểm tra role tại controller và quyền đối tượng trong handler.
2. Giữ envelope API v1, DTO tường minh và truyền cancellation token đến EF. Giữ async lặp trên cùng DbContext theo thứ tự.
3. Khi chuyển đoàn viên, lưu đơn vị mới và biến động cùng SaveChanges. Đồng bộ liên kết minh chứng qua EvidenceLinks.

# Kiểm tra

- [ ] Các luồng hiện có giữ hợp đồng.
- [ ] Kiểm tra đầu vào, phạm vi và chạy lại khi thất bại.
- [ ] Kiểm chứng các đường ghi bằng API smoke hoặc test thích hợp.
