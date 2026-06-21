# 01. BUSINESS ARCHITECTURE - KIẾN TRÚC NGHIỆP VỤ

## 1. Bản đồ Nghiệp vụ Tổng thể (Business Capability Map)
Hệ thống QLCD được cấu trúc dựa trên 5 năng lực nghiệp vụ cốt lõi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      HỆ THỐNG QUẢN LÝ CÔNG ĐOÀN BV108                  │
├───────────────┬───────────────┬───────────────┬────────────────┬───────┤
│ Quản lý       │ Quản lý       │ Thi đua &     │ Phúc lợi &     │ Báo   │
│ Đoàn viên     │ Tài chính     │ Khen thưởng   │ Thăm hỏi       │ Cáo   │
└───────┬───────┴───────┬───────┴───────┬───────┴────────┬───────┴───┬───┘
        │               │               │                │           │
        ├─ Kết nạp      ├─ Thu đoàn phí ├─ Thiết lập     ├─ Cứu trợ  ├─ Đoàn số
        ├─ Chuyển sinh  ├─ Chi hoạt động│  chỉ tiêu      │  khó khăn ├─ Thu chi
        │  hoạt         ├─ Quyết toán   ├─ Đăng ký       ├─ Thăm hỏi ├─ Thi đua
        └─ Miễn sinh    └─ Dự toán      │  thi đua       │  ốm đau   └─ Tổng hợp
           hoạt                         └─ Bình xét      └─ Quà tết     LĐ
```

## 2. Các Quy trình Nghiệp vụ Chi tiết (Business Process Flows)

### Quy trình 2.1: Quản lý biến động Đoàn viên (Kết nạp/Tiếp nhận/Chuyển đi)
* **Mô tả**: Khi có nhân viên mới tuyển dụng gia nhập công đoàn hoặc đoàn viên chuyển sang đơn vị khác ngoài BV108 (hoặc chuyển nội bộ giữa các CĐBP).
* **Luồng xử lý**:
  1. Tổ trưởng Tổ công đoàn gửi yêu cầu kết nạp/chuyển đi lên CĐBP kèm hồ sơ đính kèm (hoặc thông tin nhân sự).
  2. BCH CĐBP thẩm định thông tin và bấm duyệt gửi lên CĐCS.
  3. Văn phòng CĐCS phê duyệt cuối cùng, hệ thống tự động cập nhật trạng thái đoàn viên và chuyển quyền sinh hoạt sang đơn vị mới.

### Quy trình 2.2: Thu nộp Đoàn phí hàng tháng
* **Mô tả**: Đảm bảo việc thu đoàn phí (1% lương cơ bản hoặc mức lương thỏa thuận theo quy định Tổng LĐLĐ) được thực hiện chính xác và đúng thời hạn.
* **Luồng xử lý**:
  * *Phương án 1 (Trích lương tự động)*: Đồng bộ danh sách từ Phòng Tài chính bệnh viện -> Hệ thống tự động ghi nhận số tiền đã đóng của từng đoàn viên -> Báo cáo tổng hợp gửi CĐCS và trích lại 60% cho CĐBP/Tổ công đoàn.
  * *Phương án 2 (Đóng trực tiếp)*: Đoàn viên nộp cho Tổ trưởng công đoàn -> Tổ trưởng xác nhận trên app di động/web -> Tổ trưởng chuyển tiền lên CĐBP -> CĐBP chuyển khoản lên tài khoản CĐCS -> CĐCS xác nhận hoàn tất đợt thu.

### Quy trình 2.3: Đăng ký & Bình xét Thi đua Khen thưởng
* **Mô tả**: Diễn ra định kỳ cuối năm hoặc đột xuất sau các đợt thi đua cao điểm.
* **Luồng xử lý**:
  1. CĐCS ban hành hướng dẫn thi đua và chỉ tiêu phân bổ khen thưởng xuống các CĐBP.
  2. Tổ công đoàn tiến hành họp tổ, đoàn viên tự đánh giá và Tổ bình xét, nhập danh sách đề xuất kèm biên bản họp lên CĐBP.
  3. CĐBP tổng hợp, lọc theo chỉ tiêu khống chế của bộ phận, duyệt gửi lên CĐCS.
  4. Hội đồng thi đua CĐCS họp xét, phê duyệt quyết định khen thưởng trên hệ thống.

### Quy trình 2.4: Đề xuất Trợ cấp & Phúc lợi Thăm hỏi
* **Mô tả**: Hỗ trợ đoàn viên gặp hoàn cảnh khó khăn đột xuất, tai nạn lao động, ốm đau dài ngày hoặc chúc mừng hiếu hỷ, thai sản.
* **Luồng xử lý**:
  1. Đoàn viên hoặc Tổ trưởng công đoàn tạo phiếu yêu cầu hỗ trợ (đính kèm minh chứng như giấy ra viện, giấy chứng tử/kết hôn nếu cần).
  2. CĐBP thẩm định hồ sơ trong vòng 12h, xác minh hoàn cảnh và đề xuất mức chi theo quy chế chi tiêu nội bộ.
  3. CĐCS phê duyệt chi tiền. Hệ thống gửi thông báo cho đoàn viên và chuyển thông tin cho thủ quỹ thực hiện chi trả (chuyển khoản hoặc tiền mặt).
