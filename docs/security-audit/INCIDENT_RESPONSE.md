# Ứng phó sự cố QLCD

| Giai đoạn | Việc cần làm |
| --- | --- |
| Tiếp nhận | Chỉ định người phụ trách sự cố, bảo mật, vận hành và đầu mối dữ liệu. Ghi UTC, môi trường, cửa sổ thời gian, ID audit/trace và phạm vi nghi ngờ. Giữ bí mật và nội dung hồ sơ ngoài ticket và chat. |
| Cô lập | Nếu có truy cập trái phép đang diễn ra, chủ vận hành cô lập ingress hoặc đặt bảo trì theo phạm vi, thu hồi phiên đối tượng bằng luồng đã phê duyệt, tách máy bị ảnh hưởng. Bảo vệ môi trường đối soát, bản sao và key ring. |
| Điều tra | Bảo toàn bản sao log ingress/API, dấu audit SQL, manifest bản phát hành, ACL và nhật ký backup. Đối chiếu `AUTH_LOGIN_FAILED`, `AUTH_LOGIN_LOCKOUT`, `AUTH_LOGIN_SUCCESS`, reset, `MEMBER_DETAIL_READ`, `EVIDENCE_DOWNLOAD` và kết quả 401/403/404 theo trace. Dùng quyền đọc đã duyệt và lưu bằng chứng riêng. |
| Khắc phục | Khi nghi lộ bí mật, xác định môi trường và phụ thuộc, thu hồi rồi thay vật liệu có thể bị lộ. Giữ khả năng giải mã bản sao được duyệt trong vòng đời khóa. Với thay đổi dữ liệu, chọn bản phục hồi đồng bộ SQL, tệp và key ring trong vùng cô lập, đối chiếu trước cutover. |
| Phục hồi | Xác minh readiness, TLS, quyền chéo đơn vị, MFA, reset và tính toàn vẹn của hồ sơ/tệp. Đo RPO/RTO thực tế, kiểm dữ liệu phát sinh sau bản sao và ghi người phê duyệt trước khi mở lại truy cập. |
| Thông báo và đóng | Đầu mối pháp chế/dữ liệu xác định ngưỡng, thời hạn và đối tượng thông báo theo quy định áp dụng. Ghi đồng hồ sự cố, ảnh hưởng, quyết định, bằng chứng nghiệm thu và hành động phòng ngừa. |

Đặt cảnh báo cho mức tăng thất bại và khóa, lượt reset, lượt đọc/tải nhạy cảm bất thường, lỗi SQL/scanner, thiếu audit và bản sao quá hạn. Hiện repo có sự kiện để theo dõi. Đích lưu chống sửa, độ trễ cảnh báo và cơ chế trực cần xác nhận tại môi trường đích. [Runbook triển khai và phục hồi](08-remediation-status.md) · [Phân loại dữ liệu](DATA_PROTECTION.md)
