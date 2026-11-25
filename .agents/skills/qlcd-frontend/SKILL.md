---
name: qlcd-frontend
description: >-
  Thay đổi route, biểu mẫu, phân trang hoặc API client của Next.js QLCD.
---

# Quy trình


1. Đọc frontend/qlcd-web/AGENTS.md và tài liệu Next.js đã cài cho route hay proxy bị ảnh hưởng.
2. Dùng src/lib/api.ts cho DTO và CSRF. Các PUT cần có ID khớp route. Kiểm tra tên enum dạng chuỗi và trường rỗng có thể null.
3. Tách truy vấn danh sách khỏi lookup. Dùng useResource cho tải khi bộ lọc đổi và MemberSelect để tìm đoàn viên từ API trong phạm vi.

# Kiểm tra

- [ ] Lỗi mạng, trạng thái rỗng và phiên kết thúc có phản hồi.
- [ ] Lint, typecheck và build qua.
- [ ] Browser smoke chạy thao tác trên route bị ảnh hưởng.
