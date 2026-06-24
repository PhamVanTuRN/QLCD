# HƯỚNG DẪN TRẢI NGHIỆM CHẠY THỬ & ĐÓNG GÓP Ý KIẾN
### DỰ ÁN: PHẦN MỀM QUẢN LÝ CÔNG TÁC CÔNG ĐOÀN (QLCD SỐ 108)

Chào mừng các đồng chí đến với chương trình chạy thử nghiệm và nghiệm thu hệ thống phần mềm **Quản lý Công tác Công đoàn (QLCD Số 108)**. 

Tài liệu này được biên soạn bởi Ban dự án nhằm hướng dẫn các đồng chí kiểm thử chi tiết các chức năng đã hoàn thiện, đồng thời thu thập các ý kiến đóng góp, phản hồi để tối ưu hóa hệ thống trước khi đưa vào vận hành chính thức.

---

## 1. THÔNG TIN CHUNG & TÀI KHOẢN ĐĂNG NHẬP

Hệ thống hỗ trợ phân quyền chặt chẽ theo từng cấp độ quản lý. Để có cái nhìn toàn diện, vui lòng đăng nhập lần lượt bằng các tài khoản tương ứng dưới đây:

| Cấp Quản Lý | Tài Khoản Đăng Nhập | Mật Khẩu | Phạm Vi Quản Lý / Ghi Chú |
|:---|:---|:---|:---|
| **Quản trị hệ thống (Admin)** | `admin` | `admin123` | Toàn quyền cấu hình danh mục, quản lý tài khoản, xem toàn bộ dữ liệu. |
| **Công đoàn cơ sở (CĐCS)** | `cdcs_benhvien` | `admin123` | Chủ tịch CĐCS Bệnh viện. Quản lý toàn bộ các đơn vị cấp dưới. |
| **Công đoàn bộ phận (CĐBP)** | `cdbp_khoi_noi_1` | `admin123` | Quản lý Khối Nội 1 và các Tổ Công đoàn trực thuộc khối. |
| **Tổ Công đoàn (Tổ CĐ)** | `tocd_tieu_hoa` | `admin123` | Quản lý Tổ CĐ Khoa Tiêu hóa. |

*Địa chỉ truy cập thử nghiệm:* **`http://localhost:3000`** *(Hoặc địa chỉ IP do Quản trị viên cung cấp)*.

---

## 2. CÁC KỊCH BẢN KIỂM THỬ (TEST CASES) GỢI Ý

### Kịch bản 1: Giao diện Mới (Modern SaaS Interface)
* **Mục tiêu**: Đánh giá tính thẩm mỹ, độ tương phản và sự tiện dụng của giao diện sáng màu mới.
* **Cách thực hiện**:
  1. Đăng nhập vào hệ thống và quan sát bố cục **Sidebar** (Thanh điều hướng trái) và **Header** (Thanh tiêu đề trên).
  2. Rà chuột qua các nút, menu để xem hiệu ứng chuyển động (Micro-animations).
  3. Kiểm tra tính tương thích khi thu nhỏ/phóng to trình duyệt (Responsive Layout).
* **Nội dung cần góp ý**: Giao diện có dễ nhìn không? Tông màu sáng có gây mỏi mắt không? Các nút bấm có đủ to và rõ ràng không?

---

### Kịch bản 2: Quản lý Đoàn viên & Chuyển sinh hoạt
* **Mục tiêu**: Kiểm tra quy trình thêm mới, chỉnh sửa hồ sơ và luồng luân chuyển đoàn viên giữa các tổ.
* **Cách thực hiện**:
  1. Vào menu **"Quản lý Đoàn viên"**.
  2. Bấm **"Thêm đoàn viên"**: Nhập đầy đủ thông tin cá nhân, trình độ học vấn và thêm chứng chỉ ngoại ngữ.
  3. Chọn một đoàn viên, bấm **"Chuyển sinh hoạt"**: 
     * Chọn đơn vị chuyển đến (Ví dụ: từ *Tổ CĐ Khoa Tiêu hóa* sang *Tổ CĐ Khoa Tim mạch*).
     * Nhập lý do chuyển sinh hoạt.
     * Bấm tải lên quyết định chuyển sinh hoạt (File PDF minh chứng).
  4. Xác nhận chuyển và kiểm tra lịch sử biến động trong trang Chi tiết đoàn viên.
* **Nội dung cần góp ý**: Các trường thông tin đoàn viên đã đầy đủ chưa? Luồng chuyển sinh hoạt có dễ thực hiện không?

---

### Kịch bản 3: Quản lý Tài chính & Đoàn phí
* **Mục tiêu**: Theo dõi dòng tiền thu chi của công đoàn và đóng đoàn phí cá nhân.
* **Cách thực hiện**:
  1. Vào menu **"Tài chính & Đoàn phí"**.
  2. Thực hiện thêm mới một giao dịch chi (Ví dụ: Chi phúc lợi thăm hỏi ốm đau) hoặc giao dịch thu (Thu kinh phí cấp trên cấp).
  3. Thực hiện thu đoàn phí tháng của đoàn viên bằng cách thêm giao dịch thu loại **"Thu đoàn phí"**, liên kết với tên đoàn viên cụ thể.
  4. Quan sát số dư quỹ tự động cập nhật trên các thẻ thống kê.
* **Nội dung cần góp ý**: Các danh mục thu chi đã sát với thực tế đơn vị chưa? Có cần thêm trường thông tin nào khác không?

---

### Kịch bản 4: Sáng kiến & Phong trào Thi đua
* **Mục tiêu**: Đăng ký và duyệt sáng kiến/đề tài nghiên cứu khoa học của đoàn viên.
* **Cách thực hiện**:
  1. Vào menu **"Sáng kiến & Đề tài"**.
  2. Thêm mới một sáng kiến: Nhập tên đề tài, lĩnh vực, chọn đoàn viên là tác giả và cấp sáng kiến (Cơ sở/Bệnh viện/Cấp Bộ).
  3. Đăng nhập bằng tài khoản **Admin** hoặc **CĐCS**, chuyển trạng thái sáng kiến sang **"Đã duyệt / Nghiệm thu đạt"**.
* **Nội dung cần góp ý**: Các thông tin thu thập về sáng kiến đã đầy đủ chưa? Trạng thái phê duyệt có rõ ràng không?

---

### Kịch bản 5: Đánh giá Chất lượng Công đoàn (MỚI)
* **Mục tiêu**: Đánh giá quy trình tổng hợp tự động kết quả xếp loại chất lượng theo bộ 10 tiêu chí.
* **Cách thực hiện**:
  1. Vào menu **"Chất lượng Công đoàn"**.
  2. Chọn đơn vị cần đánh giá (Ví dụ: **Khối Nội 1** hoặc **Tổ CĐ Khoa Tiêu hóa**), chọn năm **2026**, quý **Quý 2**.
  3. Nếu màn hình hiển thị **"Chưa có dữ liệu đánh giá"**, bấm nút **"Tính toán & Đánh giá ngay"**.
  4. Nhập các số liệu thủ công cần thiết:
     * *Tổng số CNVCLĐ* (để tính tỉ lệ tham gia công đoàn của Q1).
     * *Số giới thiệu kết nạp Đảng* (cho Q4).
     * *Tỉ lệ nữ trong BCH* (cho Q7).
     * *Số vụ vi phạm kỷ luật* (cho Q8).
     * *Tỉ lệ đoàn viên hài lòng* (cho Q10).
  5. Bấm **"Xem kết quả dự thảo"**: Hệ thống tự động tính toán số liệu từ DB và đưa ra kết quả đạt/chưa đạt kèm điểm số từng tiêu chí và xếp loại dự kiến (Xuất sắc / Vững mạnh / Hoàn thành tốt).
  6. Ấn **"Lưu & Chốt kết quả"** để lưu chính thức.
  7. Tại bảng kết quả chính thức: Tiến hành đính kèm file quyết định/minh chứng PDF cho các tiêu chí tương ứng.
* **Nội dung cần góp ý**: Các công thức tính toán tự động đã chuẩn xác chưa? Giao diện xem kết quả và nhập liệu có thân thiện không?

---

## 3. MẪU GHI NHẬN Ý KIẾN GÓP Ý (FEEDBACK FORM)

Khi phát hiện lỗi hoặc có đề xuất cải tiến, xin vui lòng ghi nhận theo biểu mẫu dưới đây và gửi về cho Ban dự án:

| STT | Chức Năng | Loại Phản Hồi | Mô Tả Chi Tiết Lỗi / Ý Kiến Đóng Góp | Mức Độ Ưu Tiên | Hình Ảnh / File Minh Họa |
|:---:|:---|:---|:---|:---:|:---|
| *Ví dụ 1* | *Chất lượng Công đoàn* | *Lỗi hệ thống (Bug)* | *Khi chọn Quý 1/2026 của Khối Nội 1 và tải lên file minh chứng PDF 5MB thì báo lỗi không tải được.* | *Cao* | *DinhKem_LoiUpFile.png* |
| *Ví dụ 2* | *Quản lý Đoàn viên* | *Góp ý cải tiến* | *Nên bổ sung thêm trường "Số điện thoại người liên hệ khẩn cấp" trong form thêm mới.* | *Trung bình* | *(Không có)* |
| 1 | | | | | |
| 2 | | | | | |

*Chú thích phân loại:*
* **Lỗi hệ thống (Bug)**: Lỗi làm gián đoạn luồng xử lý, báo lỗi đỏ (500, Network error), dữ liệu tính sai.
* **Góp ý cải tiến**: Chức năng chạy đúng nhưng cần tối ưu hóa giao diện, đổi chữ hiển thị, đổi vị trí các nút để dễ dùng hơn.
* **Yêu cầu mới (Change Request)**: Cần bổ sung thêm chức năng/nghiệp vụ hoàn toàn mới chưa có trong mô tả ban đầu.

---

**Cảm ơn các đồng chí đã nhiệt tình phối hợp đóng góp ý kiến để hoàn thiện phần mềm!**
