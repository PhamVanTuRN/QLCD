---
name: ui-ux-standard
description: >-
  Áp dụng quy chuẩn hiển thị QLCD khi thêm hoặc sửa màn hình, bảng, biểu mẫu, dialog hoặc component dùng chung; kiểm cổng chất lượng và hồi quy UI.
---

# Áp dụng quy chuẩn QLCD

Dùng [qlcd-ui-ux](../qlcd-ui-ux/SKILL.md) làm quy trình và [docs/DESIGN_SYSTEM.md](../../../docs/DESIGN_SYSTEM.md) làm nguồn chuẩn duy nhất cho token, component, quy tắc theo loại màn hình và Quality Gate. Đọc phần tương ứng với tác vụ, không khảo sát lại toàn frontend cho một màn hình.

Trước khi tạo mới, tìm component đang có và các nơi sử dụng; chọn DataTable/ListPager cho danh sách, TableText cho ô dài không nằm trong link/button, FormDialog/useConfirmation cho biểu mẫu/xác nhận, LoadState/Notice cho phản hồi. Không sao chép CSS hoặc tự tạo phân trang/cuộn riêng. Ngoại lệ cần lý do thực tế và giữ Design System.

Nghiệm thu theo Quality Gate: dữ liệu lớn theo trang, nội dung dài/null, loading/empty/error, hai trục cuộn, phân trang/lọc, dialog/focus, responsive, hiệu năng và hồi quy mọi nơi dùng component sửa. Tái sử dụng `npm run test:ui` và `test:browser`; cập nhật TASK_TRACKER với kết quả quan sát và giới hạn. Chỉ đổi UI khi tác vụ là UI, giữ nguyên nghiệp vụ, API, quyền và bảo mật.
