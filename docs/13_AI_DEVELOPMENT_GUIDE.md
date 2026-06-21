# 13. AI DEVELOPMENT GUIDE - HƯỚNG DẪN PHÁT TRIỂN VỚI AI

Tài liệu này cung cấp hướng dẫn cách cộng tác với AI (như Antigravity/Claude/Gemini) để phát triển nhanh chóng và chính xác các tính năng trong dự án QLCD.

## 1. Nguyên tắc Cộng tác với AI
* **Cung cấp ngữ cảnh đầy đủ**: Luôn nhắc lại rằng hệ thống đang phát triển cho Công đoàn BV108 với quy mô 3 cấp (1 CĐCS, 15 CĐBP, 35 Tổ công đoàn, 2000 đoàn viên).
* **Độc lập lớp công nghệ**: Khi yêu cầu code Backend, nhấn mạnh việc tuân thủ Clean Architecture. AI cần viết code Domain trước, sau đó đến Application (CQRS Handlers, Validators), tiếp theo là Infrastructure (EF Configurations) và cuối cùng mới là Controllers ở lớp Web API.
* **Không nhảy cóc**: Yêu cầu AI viết code từng thành phần một, kiểm tra biên dịch thành công rồi mới chuyển sang viết giao diện Next.js tương ứng.

## 2. Quy trình Phát triển Một Tính năng Mới (Feature Workflow)
Quy trình khuyến nghị khi làm việc với AI để thêm một chức năng (Ví dụ: Thêm chức năng phê duyệt phúc lợi):

```
Step 1: Gửi BA_PROMPT + File Nghiệp vụ (03_BUSINESS_RULES.md, 05_FUNCTIONAL_REQUIREMENTS.md)
   │  └── Mục tiêu: AI làm rõ luồng nghiệp vụ chi tiết của tính năng đó.
   ▼
Step 2: Gửi ARCHITECT_PROMPT + DATABASE_PROMPT
   │  └── Mục tiêu: AI thiết kế chi tiết bảng, các cột và API contracts (request/response).
   ▼
Step 3: Gửi BACKEND_PROMPT
   │  └── Mục tiêu: AI sinh code C# cho Domain Entity, Repository Interface, MediatR Commands/Queries, Web API Controller.
   ▼
Step 4: Gửi FRONTEND_PROMPT
   │  └── Mục tiêu: AI sinh code TypeScript, React Components và React Hook Form cho giao diện.
   ▼
Step 5: Gửi TESTING_PROMPT + REFACTORING_PROMPT
      └── Mục tiêu: AI viết Unit Tests và tối ưu hóa hiệu năng, bảo mật code.
```

## 3. Quản lý Lịch sử Phản hồi của AI
* **Tạo thư viện prompt**: Tất cả các mẫu prompt đặc hiệu cho dự án được lưu trữ trong thư mục `ai-prompts/`. Người phát triển chỉ cần copy và tùy biến phần thông số nghiệp vụ cụ thể.
* **Cập nhật tài liệu sau mỗi tính năng**: Nếu trong quá trình code có phát sinh thay đổi về database hoặc nghiệp vụ thực tế, hãy cập nhật lại vào các file tài liệu nền trong `docs/` để làm tư liệu tham khảo chính xác cho các phiên làm việc tiếp theo của AI.
