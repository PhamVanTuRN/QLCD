# 13. AI DEVELOPMENT GUIDE - HƯỚNG DẪN PHÁT TRIỂN VỚI AI

Đọc [AGENTS](../AGENTS.md) và [tổng quan QLCD](PROJECT_OVERVIEW.md) để xác định kiến trúc, phạm vi và yêu cầu hiện hành trước khi giao việc cho agent.

## 1. Nguyên tắc Cộng tác với AI
- Ghi hành vi cần thay đổi, đối tượng, vai trò, phạm vi tổ chức và luồng cũ liên quan. Dùng [quy tắc nghiệp vụ hiện hành](03-Business-Rules.md) và số liệu fixture tổng hợp.
- Giữ hợp đồng API v1, tái sử dụng handler, DTO và component. Chọn [kỹ năng trong repo](../.agents/skills) theo phần chịu tác động và bảo toàn thay đổi có sẵn trong Git.
- Với thay đổi bảo mật hoặc SQL, dùng fixture cô lập và đối chiếu [cổng kiểm tra](security-audit/07-security-checklist.md). Áp migration lên dữ liệu thực cần phê duyệt vận hành.

## 2. Quy trình Phát triển Một Tính năng Mới (Feature Workflow)
1. Xác định entry point, dữ liệu, quyền, trạng thái và luồng hồi quy theo hợp đồng hiện hành.
2. Chỉnh phần cần thiết từ UI qua controller, handler và SQL. Đối chiếu quyền tại backend và kiểm tính nhất quán khi lưu lỗi hoặc ghi đồng thời nếu có tác động.
3. Kiểm thử phần mới và luồng cũ chịu ảnh hưởng theo [hướng dẫn kiểm thử](TESTING.md). Ghi lệnh, số ca và giới hạn của môi trường.
4. Cập nhật tài liệu sở hữu quy tắc bị thay đổi và ghi bằng chứng vào [TASK_TRACKER](TASK_TRACKER.md).

## 3. Quản lý Lịch sử Phản hồi của AI
Các [mẫu prompt](../ai-prompts) cung cấp ngữ cảnh theo vai trò. Đối chiếu hướng dẫn repo và mã triển khai khi dùng mẫu. Dùng liên kết tới tài liệu hiện có để ghi yêu cầu lâu dài.
