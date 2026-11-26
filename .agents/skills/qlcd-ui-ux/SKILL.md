---
name: qlcd-ui-ux
description: >-
  Đánh giá hoặc chỉnh giao diện QLCD: bố cục, bảng, phân trang, cuộn, responsive, bàn phím và khả năng truy cập; bảo toàn nghiệp vụ.
---

# Quy trình

1. Đọc [Design System](../../../docs/DESIGN_SYSTEM.md), phần quy chuẩn theo loại màn hình và UI/UX Quality Gate. Kiểm Git và hướng dẫn frontend; chỉ đọc tài liệu Next đã cài nếu sửa convention/router/layout/proxy.
2. Xác định route, vai trò và tất cả nơi dùng component bị sửa. Chọn mẫu Members cho danh sách có tổng, Activities cho hasMore. Tái sử dụng DataTable, ListPager, TableText, FormDialog, DialogCloseButton, useConfirmation, LoadState, Notice, MemberSelect trước khi tạo mới. Không đổi API, validation, quyền hoặc xử lý nghiệp vụ.
3. Đặt pager ngoài hai trục cuộn DataTable; giữ scope cột và tên vùng. Chỉ hiện tổng khi API trả tổng. Lọc/đổi số dòng về trang 1; kiểm xóa dòng cuối trang. Dữ liệu dài phải đọc được bằng bàn phím/cảm ứng; không đặt TableText trong link/button.
4. Dùng fixture tổng hợp theo trang trong `tests/ui-quality.mjs` và fixture thật cô lập của `tests/browser.mjs`. Không seed database hiện có. Kiểm 0/1/7/20/50/100/500/1.000/10.000 dòng, null, tên dài, số lớn, cây nhiều cấp và trạng thái; phân biệt tổng nguồn với số DOM.
5. Kiểm các viewport/zoom trong Quality Gate; đo overflow, thực hiện hai trục cuộn, xem cột cuối, pager và nút cuối dialog. Kiểm mở/đóng, focus, Escape, lớp lồng, tải/rỗng/lỗi/thử lại và quyền. Quan sát ảnh trước/sau ở ít nhất một mobile và desktop khi sửa đáng kể.
6. Chạy `npm run test:ui`, lint/typecheck/build và browser smoke. Nếu component dùng chung đổi, kiểm mọi màn hình đang dùng; lưu kết quả trong TASK_TRACKER. Không coi viewport tương đương là zoom thật hoặc mock là kiểm chứng SQL/API.

# Nghiệm thu

Áp dụng UI/UX Quality Gate trong tài liệu nguồn; ghi số màn hình, số liệu đã đo, ảnh, lệnh và giới hạn thật. Lỗi kiểm thử còn mở phải ghi rõ, không tuyên bố hoàn thành toàn bộ. Không nhân bản checklist chi tiết vào AGENTS.
