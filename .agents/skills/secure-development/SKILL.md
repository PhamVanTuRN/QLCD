---
name: secure-development
description: Phát triển hoặc sửa luồng QLCD có biên tin cậy, gồm API, xác thực, phân quyền, database và tích hợp ngoài.
---

# Phát triển an toàn

1. Xác định đầu vào, dữ liệu trả, actor và trạng thái chuyển đổi trước khi sửa. Dùng DTO riêng và lấy danh tính từ phiên. Kiểm vai trò và phạm vi ở backend, với cả nguồn và đích khi cập nhật quan hệ.
2. Dùng truy vấn EF hoặc tham số SQL, bounds và cancellation token. Khi đã kiểm quyền dựa trên thuộc tính có thể thay đổi, giữ kiểm tra và ghi trong cùng ranh giới nhất quán. Giữ audit và thay đổi nghiệp vụ trong cùng lần commit khi chúng cùng mô tả một hành động.
3. Giữ cookie HttpOnly, CSRF, OTP, kiểm tra nguồn và thông báo lỗi an toàn. Đọc [quy tắc xác thực](../../../docs/AUTHENTICATION.md) khi động tới phiên hoặc credential. Tích hợp ngoài chỉ dùng đích đã cấu hình, thời hạn và giới hạn dữ liệu.
4. Dùng cấu hình ngoài Git, dữ liệu tổng hợp và quyền tối thiểu. Chạy [kiểm thử bảo mật](../security-testing/SKILL.md) cho đường ghi, quyền, luồng thất bại và hành vi cũ bị tác động.
