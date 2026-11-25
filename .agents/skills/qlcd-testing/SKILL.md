---
name: qlcd-testing
description: >-
  Bổ sung hồi quy hoặc kiểm chứng QLCD bằng xUnit, HTTP smoke, SQL Express và Playwright.
---

# Quy trình


1. Đọc README.md và chọn lớp kiểm thử theo lỗi. API Debug là đầu vào của tools/test-security-smoke.mjs và browser test.
2. Dùng database, path, phiên và dữ liệu tổng hợp riêng. browser.mjs dùng Next production và ingress loopback. Phân tích JSON và ảnh trong artifacts/browser.
3. Chạy lại nhóm kiểm thử liên quan sau mỗi sửa đổi. Nếu browser thất bại, đọc trạng thái route, response và selector trước khi chỉnh.

# Kiểm tra

- [ ] Assertions dựa trên kết quả nghiệp vụ và thay đổi dữ liệu.
- [ ] Ghi số test và lệnh thật sự chạy.
- [ ] Ghi giới hạn trình duyệt, provider và môi trường.
