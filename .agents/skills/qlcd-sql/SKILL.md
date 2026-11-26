---
name: qlcd-sql
description: >-
  Đánh giá hoặc thay đổi schema, migration, truy vấn EF Core và hiệu năng SQL Server của QLCD.
---

# Quy trình


1. Mở QLCDDbContext và migration gần nhất. Rà nullable, FK, chỉ mục, global filter, concurrency token và tác động đến dữ liệu cũ.
2. Kiểm tra biểu thức EF trên SQL Server thật trong DB mang tên riêng. Với báo cáo, tổng hợp dữ liệu trong SQL trước phân trang và đo trên quy mô phù hợp.
3. Chạy `tools/test-sql.ps1` trên database riêng để kiểm schema trống, nâng schema có fixture và chạy lại idempotent. Cập nhật mốc script cho cả migration chỉ đồng bộ metadata EF. Kiểm `has-pending-model-changes` sau cập nhật. [Kiểm thử SQL](../../../docs/TESTING.md)
4. Với thay đổi kiểm quyền hoặc trạng thái khi ghi, dùng hai context SQL để xác nhận lệnh cũ bị từ chối. Phân biệt khóa SQL của bộ đếm đăng nhập với cờ khóa tài khoản. Ghi tác động lên dữ liệu và trình tự triển khai theo [hướng dẫn migration](../../../docs/SECURITY.md).

# Kiểm tra

- [ ] Không có model drift hoặc lỗi khi apply hai lần.
- [ ] Dữ liệu cũ trong fixture có kết quả mong đợi.
- [ ] Có phương án phục hồi hợp lệ cho môi trường triển khai.
