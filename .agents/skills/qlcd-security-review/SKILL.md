---
name: qlcd-security-review
description: >-
  Rà soát phòng thủ cho xác thực, scope hiện hành, đầu vào, audit, tệp và dependency QLCD.
---

# Quy trình


1. Đọc docs/security-audit/README.md và 08-remediation-status.md trong cùng thư mục để hiểu đường cơ sở.
2. Lần theo cookie và CSRF qua Program.cs, SessionAuthenticationHandler, role tại route, OrganizationScopeService và từng DTO trả về. So sánh quyền trên đọc, ghi và tệp.
3. Kiểm tra migration secret và audit với dữ liệu tổng hợp. Chạy HTTP smoke trên loopback và đối chiếu lockfile với catalog advisory offline.
4. Khi sửa xác thực, đọc `docs/AUTHENTICATION.md`, `docs/TWO_FACTOR_AUTHENTICATION.md` và `docs/ACCOUNT_RECOVERY.md`. Thử gọi API nghiệp vụ trong từng trạng thái trung gian. Kiểm tra mã kích hoạt, xác thực lại, thu hồi phiên, chạy đồng thời, replay và phục hồi với SQL cô lập. Giữ mã, mật khẩu, token, QR và khóa TOTP ngoài log và ảnh minh chứng.

# Kiểm tra

- [ ] Phát hiện nêu tác động, vị trí và biện pháp sửa.
- [ ] Giá trị credential và dữ liệu cá nhân được giữ ngoài báo cáo.
- [ ] Đánh dấu phần cần nghiệm thu ở ingress, SQL, ClamAV và backup.
