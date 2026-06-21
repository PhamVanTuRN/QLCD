# 07. SYSTEM MODULES - CÁC PHÂN HỆ HỆ THỐNG

Hệ thống QLCD Bệnh viện TWQĐ 108 bao gồm 9 phân hệ chức năng chính được phân rã như sau:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HỆ THỐNG CÔNG ĐOÀN SỐ QLCD                      │
├───────────────┬───────────────┬───────────────┬────────────────┬───────┤
│ 1. Quản lý    │ 2. Quản lý    │ 3. Quản lý    │ 4. Khen thưởng │ 5. Văn│
│    Tổ chức    │    Đoàn viên  │    Hoạt động  │    Kỷ luật     │   bản │
├───────────────┼───────────────┼───────────────┼────────────────┼───────┤
│ 6. Tài chính  │ 7. Chăm lo    │ 8. Sáng kiến  │ 9. Thi đua     │ 10. Dashboard
│    Công đoàn  │    Phúc lợi   │    Nghiên cứu │    Trực tuyến  │    Báo cáo
└───────────────┴───────────────┴───────────────┴────────────────┴───────┘
```

## 1. Phân hệ 1: Quản lý Tổ chức Công đoàn
* Vẽ cây sơ đồ tổ chức công đoàn 3 cấp.
* Gán cán bộ Ban chấp hành phụ trách đơn vị.
* Quản lý liên kết Khối chuyên môn cho các đơn vị.

## 2. Phân hệ 2: Quản lý Đoàn viên
* Quản lý hồ sơ chi tiết (Thông tin quân nhân, học vấn, đa ngoại ngữ).
* Lưu lịch sử 9 loại biến động nhân sự công đoàn trong Database Transactions.
* Tính toán tự động số lượng đoàn viên ở các cấp (CĐCS, CĐBP, Tổ công đoàn).

## 3. Phân hệ 3: Quản lý Hoạt động Công đoàn
* Đăng ký sự kiện phong trào và lịch tuần/tháng.
* Check-in QR Code và điểm danh điện tử.

## 4. Phân hệ 4: Quản lý Khen thưởng & Kỷ luật
* Cập nhật các quyết định khen thưởng thi đua, chiến sĩ thi đua toàn viện.
* Ghi nhận và theo dõi thời gian hiệu lực kỷ luật đoàn viên.

## 5. Phân hệ 5: Quản lý Văn bản, Tài liệu
* Lưu trữ văn bản đi/đến của công đoàn.
* Thư viện biểu mẫu, quy chế hoạt động công đoàn.

## 6. Phân hệ 6: Quản lý Tài chính Công đoàn
* Quản lý thu đoàn phí tự động/thủ công.
* Quyết toán và phân bổ quỹ trích lại 60% cho cơ sở.

## 7. Phân hệ 7: Quản lý Phúc lợi Đoàn viên
* Đề xuất và phê duyệt trợ cấp khó khăn, hiếu, hỷ, ốm đau nằm viện.

## 8. Phân hệ 8: Quản lý Sáng kiến & Lao động Sáng tạo
* Đăng ký đề tài nghiên cứu khoa học quân y, sáng kiến cải tiến kỹ thuật bệnh viện.

## 9. Phân hệ 9: Thi đua trực tuyến
* Chấm điểm và xếp hạng tự động thi đua giữa các CĐBP và cá nhân đoàn viên.
