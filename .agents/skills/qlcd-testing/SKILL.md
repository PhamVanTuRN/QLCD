---
name: qlcd-testing
description: >-
  Bổ sung hồi quy hoặc kiểm chứng QLCD bằng xUnit, HTTP smoke, SQL Express và Playwright.
---

# Quy trình


1. Dùng [ma trận hồi quy và cấu hình fixture](../../../docs/TESTING.md) để chọn xUnit, HTTP, SQL hoặc browser. HTTP và browser smoke mặc định dùng API Debug và hỗ trợ `QLCD_TEST_API_DLL`.
2. Dùng database, storage, phiên và dữ liệu tổng hợp riêng. `browser.mjs` dùng Next production và ingress loopback. Xem JSON và ảnh trong `artifacts/browser` hoặc thư mục được cấu hình.
3. Chạy lại nhóm kiểm thử liên quan sau mỗi sửa đổi. Nếu browser thất bại, đọc trạng thái route, response và selector trước khi chỉnh.

# Kiểm tra

- [ ] Assertions dựa trên kết quả nghiệp vụ và thay đổi dữ liệu.
- [ ] Ghi số test và lệnh thật sự chạy.
- [ ] Ghi giới hạn trình duyệt, provider và môi trường.
