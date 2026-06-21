# 12. REPORTING AND DASHBOARD - BÁO CÁO & DASHBOARD

Tài liệu này mô tả các yêu cầu thiết kế hệ thống báo cáo tĩnh, báo cáo động và các bảng điều khiển trực quan (Dashboards) trong phần mềm QLCD.

## 1. Hệ thống Dashboard Trực quan (Real-time Dashboards)

### Dashboard 1.1: Tổng quan dành cho BCH CĐCS (Cấp bệnh viện)
* **Các chỉ số chính (KPI Cards)**:
  * Tổng số đoàn viên hiện tại (kèm biểu đồ tăng/giảm so với tháng trước).
  * Tổng số tiền quỹ công đoàn hiện có (Số dư CĐCS + Số dư các CĐBP).
  * Số lượng đề xuất trợ cấp/thi đua đang chờ xử lý.
  * Tỷ lệ đóng đoàn phí hoàn thành của tháng hiện tại.
* **Biểu đồ trực quan (Charts)**:
  * Biểu đồ cột: So sánh tiến độ đóng đoàn phí giữa 15 CĐBP.
  * Biểu đồ đường: Xu hướng biến động đoàn số qua các quý trong năm.
  * Biểu đồ tròn: Cơ cấu chi tiêu tài chính (Chi thăm hỏi, chi thi đua, chi phong trào, trích nộp cấp trên).

### Dashboard 1.2: Dành cho BCH CĐBP (Cấp khoa/ban)
* **Các chỉ số chính**:
  * Số lượng đoàn viên thuộc quản lý (phân theo các tổ công đoàn).
  * Quỹ công đoàn bộ phận được trích lại hiện tại.
  * Danh sách đề xuất của Tổ trưởng cần duyệt gấp.
* **Biểu đồ**:
  * Biểu đồ cột ngang: Tỷ lệ xếp loại thi đua của các tổ trực thuộc.

## 2. Hệ thống Báo cáo Định kỳ & Kết xuất (Reporting)

### Báo cáo 2.1: Báo cáo biến động đoàn viên (Đoàn số)
* **Tần suất**: Hàng quý / Cuối năm.
* **Mục tiêu**: Xuất file Excel theo chuẩn biểu mẫu của Tổng Liên đoàn Lao động để báo cáo cấp trên.
* **Các cột thông tin chính**: Số lượng đầu kỳ, số kết nạp mới, số chuyển đến, số chuyển đi, số giảm (nghỉ hưu, thôi việc), số cuối kỳ phân loại theo độ tuổi, giới tính, trình độ chuyên môn.

### Báo cáo 2.2: Báo cáo quyết toán thu chi tài chính công đoàn
* **Tần suất**: Hàng tháng / Hàng quý / Cuối năm.
* **Cấu trúc dữ liệu**:
  * Phần thu: Thu đoàn phí (60% trích lại), thu khác (bệnh viện cấp, tài trợ).
  * Phần chi: Chi tiết theo mục lục chi (Chi thăm hỏi đoàn viên, chi tuyên truyền giáo dục, chi hoạt động thể thao văn hóa, chi quản lý hành chính...).
  * Số dư đầu kỳ, số phát sinh trong kỳ, số dư cuối kỳ chuyển sang kỳ sau.
* **Định dạng kết xuất**: Excel (`.xlsx`), PDF phục vụ in ấn ký đóng dấu.

### Báo cáo 2.3: Báo cáo tổng hợp thi đua khen thưởng
* **Tần suất**: Sau mỗi đợt thi đua hoặc cuối năm.
* **Nội dung**: Danh sách đoàn viên được khen thưởng, hình thức khen thưởng, thành tích đóng góp chi tiết của từng cá nhân được duyệt bởi Hội đồng thi đua CĐCS.
