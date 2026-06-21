# 05. FUNCTIONAL REQUIREMENTS - YÊU CẦU CHỨC NĂNG

Tài liệu này liệt kê các yêu cầu chức năng (FR) chi tiết cho Hệ thống Quản lý Công đoàn BV108.

## 1. Phân hệ Quản lý Tổ chức & Danh mục (FR-ORG)
* **FR-ORG-01 (Quản lý Đơn vị Công đoàn)**: Cho phép thêm, sửa, xem thông tin 15 CĐBP và các Tổ công đoàn trực thuộc. Thiết lập mối quan hệ cấp cha-con giữa các đơn vị.
* **FR-ORG-02 (Cấu hình Người đại diện)**: Gán quyền Tổ trưởng cho tài khoản đoàn viên tương ứng với từng Tổ công đoàn; gán quyền Chủ tịch/Phó Chủ tịch CĐBP, CĐCS.
* **FR-ORG-03 (Quản lý Danh mục dùng chung)**: Quản lý danh mục loại phúc lợi (ốm đau, thai sản, hiếu hỉ...), danh mục hình thức khen thưởng, danh mục chức danh y tế.

## 2. Phân hệ Quản lý Hồ sơ Đoàn viên (FR-MEM)
* **FR-MEM-01 (Tiếp nhận Đoàn viên)**: Tổ trưởng nhập thông tin trực tiếp hoặc đoàn viên tự đăng ký trực tuyến, gửi hồ sơ chờ phê duyệt.
* **FR-MEM-02 (Phê duyệt Hồ sơ)**: Quy trình phê duyệt qua 2 cấp: BCH CĐBP duyệt sơ bộ -> Văn phòng CĐCS phê duyệt chính thức và cấp mã đoàn viên.
* **FR-MEM-03 (Chuyển sinh hoạt Nội bộ)**: Chuyển đoàn viên từ Tổ công đoàn này sang Tổ công đoàn khác trong bệnh viện (do chuyển công tác chuyên môn).
* **FR-MEM-04 (Chuyển sinh hoạt Ngoại bộ)**: Thực hiện thủ tục cho đoàn viên chuyển hẳn ra ngoài bệnh viện hoặc tiếp nhận đoàn viên từ đơn vị khác về.
* **FR-MEM-05 (Cập nhật Trạng thái)**: Chuyển đổi trạng thái hoạt động (Đang sinh hoạt, Miễn sinh hoạt do thai sản/đi học, Đã xóa tên khỏi danh sách đoàn viên).

## 3. Phân hệ Quản lý Tài chính (FR-FIN)
* **FR-FIN-01 (Đồng bộ Bảng lương thu đoàn phí)**: Cho phép import file Excel bảng lương hàng tháng từ Phòng Tài chính bệnh viện để tự động ghi nhận đóng đoàn phí.
* **FR-FIN-02 (Thu đoàn phí thủ công)**: Tổ trưởng công đoàn có thể thu bằng tiền mặt và click xác nhận trạng thái đóng tiền của đoàn viên trên giao diện mobile/web.
* **FR-FIN-03 (Tự động Phân bổ Kinh phí)**: Hệ thống tự động tính toán số tiền được trích lại 60% của từng CĐBP, lưu vết số dư tài khoản của từng đơn vị.
* **FR-FIN-04 (Quản lý Thu - Chi Khác)**: Ghi nhận các nguồn thu khác (bệnh viện hỗ trợ, nhà tài trợ...) và các khoản chi hoạt động phong trào của CĐCS/CĐBP.

## 4. Phân hệ Thi đua & Bình xét (FR-AWD)
* **FR-AWD-01 (Thiết lập Đợt thi đua)**: CĐCS khởi tạo các đợt thi đua (Ví dụ: Thi đua chào mừng Ngày Thầy thuốc Việt Nam 27/2, Thi đua cuối năm...). Cấu hình chỉ tiêu phân bổ giải thưởng.
* **FR-AWD-02 (Gửi Đề xuất Thi đua)**: Tổ trưởng công đoàn nhập biên bản và danh sách đoàn viên được đề nghị khen thưởng từ cuộc họp tổ.
* **FR-AWD-03 (Thẩm định & Khống chế Tỷ lệ)**: Hệ thống tự động cảnh báo nếu tỷ lệ đề xuất vượt quá số % quy định của CĐBP đó (Ví dụ: vượt quá 15% đoàn viên xuất sắc).
* **FR-AWD-04 (Quyết định Khen thưởng)**: BCH CĐCS phê duyệt và ban hành quyết định khen thưởng trên hệ thống, tự động gửi thông báo chúc mừng tới cá nhân đoàn viên.

## 5. Phân hệ Phúc lợi & Cứu trợ (FR-WEL)
* **FR-WEL-01 (Yêu cầu Trợ cấp/Thăm hỏi)**: Đoàn viên hoặc Tổ trưởng tạo đơn yêu cầu thăm hỏi (ốm đau nằm viện, hiếu hỉ, thai sản, thân nhân qua đời...).
* **FR-WEL-02 (Đính kèm Minh chứng)**: Chụp ảnh giấy ra viện, giấy chứng nhận kết hôn... tải trực tiếp lên hệ thống.
* **FR-WEL-03 (Phê duyệt Trợ cấp)**: Quy trình phê duyệt nhanh (CĐBP kiểm tra xác thực -> CĐCS phê duyệt chi tiền).
* **FR-WEL-04 (Xác nhận Chi trả)**: Thủ quỹ xác nhận trạng thái đã chi tiền (Tiền mặt/Chuyển khoản), hệ thống lưu lại mã giao dịch.

## 6. Phân hệ Tương tác & Thông báo (FR-NOT)
* **FR-NOT-01 (Bảng tin Công đoàn)**: Đăng tải các tin tức, hoạt động chính sách, văn bản chỉ đạo mới của công đoàn bệnh viện.
* **FR-NOT-02 (Hệ thống Thông báo)**: Gửi thông báo tức thời (Push Notification/Email) cho đoàn viên khi: có thông tin đóng đoàn phí thành công, có quyết định khen thưởng, hoặc đề xuất trợ cấp được duyệt.
