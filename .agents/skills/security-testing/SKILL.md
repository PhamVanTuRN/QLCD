---
name: security-testing
description: Kiểm chứng phòng thủ và hồi quy QLCD khi sửa bảo mật, thay đổi chức năng nhạy cảm hoặc chuẩn bị phát hành.
---

# Kiểm thử bảo mật

1. Chọn theo [cổng kiểm tra](../../../docs/security-audit/07-security-checklist.md) và mở [lệnh kiểm thử repo](../../../docs/TESTING.md) khi cần. Dùng loopback, fixture tổng hợp, SQL riêng và vị trí tệp riêng.
2. Kiểm đường hợp lệ và từ chối theo vai trò, phạm vi và trạng thái. Kiểm phiên giới hạn, thu hồi, OTP dùng lại, ngưỡng khóa và ghi đồng thời khi bị ảnh hưởng. Kiểm trạng thái SQL và audit, không chỉ mã HTTP.
3. Chạy luật SAST cục bộ, đối chiếu advisory theo lockfile, quét secret đã che và kiểm SBOM theo workflow repo. Không dùng secret thật làm mẫu kiểm thử. Ghi phiên bản, đường dẫn, lệnh, exit code và phần chưa kiểm.
4. Báo lỗi chưa xử lý đúng mức độ. Chỉ đóng phát hiện sau kiểm tra lại và chỉ đề nghị phát hành khi cổng kiểm tra có đủ bằng chứng.
