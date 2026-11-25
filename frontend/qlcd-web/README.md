# Frontend Công đoàn số 108

Next.js App Router cung cấp giao diện tiếng Việt. Trình duyệt gọi `/api/v1` cùng origin. Chế độ phát triển chuyển tiếp tới API local ở cổng 5023. Môi trường triển khai đưa cùng đường dẫn qua ingress HTTPS. [Khởi chạy local](../../README.md) · [Runbook ingress](../../docs/security-audit/08-remediation-status.md)

Chạy `npm ci --no-audit --no-fund`, `npm run dev` để phát triển. Xác minh bằng `npm run lint -- --max-warnings 0`, `npm run build` và `npm run typecheck`. Sau khi build API Debug, `npm run test:browser` chạy Chromium với dữ liệu tổng hợp. [Kịch bản kiểm thử](tests/browser.mjs)

Route ở `src/app`. Shell, dialog, trạng thái tải và tra cứu đoàn viên ở `src/components`. Hợp đồng và client API ở `src/lib`. [Thiết kế giao diện](../../docs/DESIGN_SYSTEM.md) · [Hướng dẫn agent cho Next.js](AGENTS.md)
