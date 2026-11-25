<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
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