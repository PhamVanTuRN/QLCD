---
name: qlcd-sql
description: >-
  Đánh giá hoặc thay đổi schema, migration, truy vấn EF Core và hiệu năng SQL Server của QLCD.
---

# Quy trình


1. Mở QLCDDbContext và migration gần nhất. Rà nullable, FK, chỉ mục, global filter, concurrency token và tác động đến dữ liệu cũ.
2. Kiểm tra biểu thức EF trên SQL Server thật trong DB mang tên riêng. Với báo cáo, tổng hợp dữ liệu trong SQL trước phân trang và đo trên quy mô phù hợp.
3. Chạy tools/test-sql.ps1 trên SQL Express local để diễn tập schema trống, nâng schema có fixture và chạy lại idempotent. Cập nhật mốc migration trong script khi thêm migration.

# Kiểm tra

- [ ] Không có model drift hoặc lỗi khi apply hai lần.
- [ ] Dữ liệu cũ trong fixture có kết quả mong đợi.
- [ ] Có phương án phục hồi hợp lệ cho môi trường triển khai.
