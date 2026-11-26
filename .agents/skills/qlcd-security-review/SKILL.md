---
name: qlcd-security-review
description: >-
  Kiểm duyệt phòng thủ mã nguồn, PR, kiến trúc hoặc bản phát hành QLCD theo mô hình đe dọa và bằng chứng.
---

# Quy trình


1. Đọc [báo cáo hiện hành](../../../docs/security-audit/SECURITY_AUDIT.md) để xác lập phạm vi và đường cơ sở. Khoanh vùng diff, tài sản, biên tin cậy, vai trò và đường dữ liệu chịu tác động.
2. Lần theo cookie và CSRF qua Program.cs, SessionAuthenticationHandler, role tại route, OrganizationScopeService và từng DTO trả về. So sánh quyền trên đọc, ghi và tệp.
3. Lập STRIDE cho biên thay đổi. Ghi ID, vị trí, điều kiện, ảnh hưởng, mức độ, cách xử lý, bằng chứng và kết quả kiểm tra lại. Đánh giá Critical, High, Medium hoặc Low theo tác động và khả năng xảy ra. Tách điểm quan sát tĩnh, rủi ro vận hành và bằng chứng kiểm thử.
4. Khi sửa xác thực, đối chiếu [kiến trúc xác thực](../../../docs/AUTHENTICATION.md). Dùng dữ liệu tổng hợp và kiểm thử phòng thủ trong phạm vi đã cho phép theo [security-testing](../security-testing/SKILL.md). Giữ mã, mật khẩu, token, QR và khóa TOTP ngoài log và ảnh minh chứng.
5. Với quản trị tài khoản, xác minh quyền reset theo ID và vai trò hiện hành, OTP mới, thu hồi phiên và audit. Phân biệt khóa đăng nhập theo SQL với cờ khóa quản trị và trạng thái đơn vị. Với dữ liệu nhạy cảm, kiểm sự kiện audit sau khi cho phép đọc hồ sơ hoặc tải minh chứng. [Quy tắc khôi phục](../../../docs/ACCOUNT_RECOVERY.md)

# Kiểm tra

- [ ] Phát hiện nêu tác động, vị trí và biện pháp sửa.
- [ ] Giá trị credential và dữ liệu cá nhân được giữ ngoài báo cáo.
- [ ] Đánh dấu phần cần nghiệm thu ở ingress, SQL, ClamAV và backup.
