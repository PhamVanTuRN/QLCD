<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
 Nguyên tắc thực hiện để tối ưu thời gian và token

Đọc AGENTS.md và các tài liệu liên quan trước khi sửa.

Chỉ tìm kiếm và đọc các file trực tiếp liên quan đến Authentication, Authorization, Password, MFA và Account Management.

Không phân tích lại toàn bộ codebase nếu không cần thiết.

Tái sử dụng service, component, validation và kiến trúc hiện có.

Chỉ chỉnh sửa những file thực sự cần thiết.

Không refactor ngoài phạm vi yêu cầu.

Không cài thêm thư viện nếu thành phần hiện tại đáp ứng được.

Không giải thích dài dòng, không in lại toàn bộ mã nguồn hoặc diff.

Chủ động quyết định các vấn đề kỹ thuật thông thường, không hỏi lại những nội dung có thể xác định từ codebase.

Không tự ý reset dữ liệu tài khoản hiện có hoặc thay đổi dữ liệu production.

Cập nhật nguyên tắc nghiệp vụ vào AGENTS.md và tài liệu bảo mật hiện có; không tạo nhiều file tài liệu trùng lặp.

Kiểm thử các luồng thay đổi, kiểm tra phân quyền, chống bỏ qua 2FA và chạy build phù hợp. Chỉ mở rộng phạm vi kiểm thử khi cần thiết.

## Hủy bước xác nhận

Dùng `FormDialog` và `DialogCloseButton` cho nút X; không dùng `window.confirm` cho xác nhận nghiệp vụ. X, Escape và Hủy chỉ đóng trạng thái chờ, không gọi API ghi. Khi đã gửi yêu cầu, khóa X trong lúc xử lý; không biểu thị rằng đóng giao diện có thể hoàn tác yêu cầu đã gửi. Hộp thoại lồng nhau chỉ hủy lớp trên cùng và trả focus về nút mở. Không dùng nút đóng để vượt qua xác thực bắt buộc.

Phân biệt cờ khóa tài khoản và trạng thái đơn vị: hiển thị riêng organizationActive/accountArchived/canSignIn; mở khóa không khôi phục đơn vị. Cây chính chỉ có đơn vị hoạt động. Ngừng/khôi phục dùng thao tác riêng có xác nhận và khu vực ngừng hoạt động có phân trang; không có lựa chọn đổi trạng thái trong form sửa thông tin. Không dùng từ Xóa cho thao tác ngừng đơn vị.

Khối quản lý dùng management-blocks tại Danh mục gốc; không gọi API danh mục chung để ghi loại KhoiChuyenMon. Khi tạo đơn vị, yêu cầu chọn rõ khối đang dùng; không tự chọn khối cha/khối đầu tiên. Cây chỉ thêm group header/nhãn, giữ node ID, MaParent và quyền hiện hành. Form sửa cho giữ MaKhoi null cũ hoặc khối ngừng hiện có, không âm thầm xóa/thay liên kết. Số đơn vị liên kết chỉ hiển thị khi API trả cho ADMIN.

Khối quản lý trong /catalogs dùng ManagementBlocksPanel và endpoint management-blocks, không dùng API danh mục generic cho khối. Form tạo đơn vị phải để placeholder trống và yêu cầu chọn khối đang dùng; form sửa giữ liên kết khối ngừng hiện có và giá trị null cũ, không tự chọn thay thế khi lookup lỗi. Group header khối chỉ phân nhóm các node cùng cha, không mang ID tổ chức/tài khoản và không thay scope. Label của select phải liên kết rõ bằng htmlFor/id.
