---
name: data-protection
description: Đánh giá hoặc thay đổi cách QLCD xử lý dữ liệu cá nhân, hồ sơ SQL, báo cáo, tệp và chia sẻ.
---

# Bảo vệ dữ liệu

1. Dùng [phân loại dữ liệu QLCD](../../../docs/security-audit/DATA_PROTECTION.md) để xác định mục đích, nhóm dữ liệu, nguồn, nơi lưu và người nhận. Rà cả API, log, cache, tệp tạm và bản sao.
2. Giới hạn DTO và trường hiển thị theo nhiệm vụ và phạm vi hiện tại. Khi thêm export, áp cùng bộ lọc như API nguồn và xử lý ô bảng tính dạng văn bản khi dữ liệu do người dùng nhập.
3. Kiểm quyền theo từng tệp. Tách storage riêng, kiểm nội dung, dung lượng, tên lưu và đường dẫn. Đánh giá TLS, mã hóa lưu trữ, vòng đời key ring và restore đồng bộ.
4. Tài liệu và test chỉ chứa dữ liệu tổng hợp. Điều chỉnh lưu trữ, chia sẻ và hủy dữ liệu thật theo quyết định của chủ dữ liệu và quy trình pháp lý đã duyệt.
