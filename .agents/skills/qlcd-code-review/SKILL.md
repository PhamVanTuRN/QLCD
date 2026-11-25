---
name: qlcd-code-review
description: >-
  Review diff QLCD tập trung vào regression, hợp đồng, phạm vi và dữ liệu cũ.
---

# Quy trình


1. Đối chiếu AGENTS.md, Git status và mục đích thay đổi. Chỉ gán phát hiện cho phần diff có liên quan.
2. Kiểm chuỗi UI → API → handler → SQL. Ưu tiên test migration, update body ID, scope trên query và thao tác sau khi đoàn viên đổi tổ.
3. Xem lỗi khi có nhiều yêu cầu đồng thời, trường optional, trạng thái chờ và khả năng dùng bàn phím.

# Kiểm tra

- [ ] Dẫn tệp và vị trí, mức độ, tác động và cách kiểm tra.
- [ ] Bằng chứng phân biệt đã chạy và còn cần chạy.
- [ ] Bảo toàn tương thích và các ràng buộc nghiệp vụ hiện hành.
