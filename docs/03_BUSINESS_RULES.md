# 03. BUSINESS RULES - QUY ĐỊNH NGHIỆP VỤ

Tài liệu này định nghĩa các quy tắc kiểm tra logic (Business Rules) cần áp dụng khi lập trình hệ thống QLCD.

## 1. Quy định về Đoàn viên (Membership Rules)
* **BR_MEM_01 (Tuổi đoàn viên)**: Đoàn viên phải từ 18 tuổi trở lên tại thời điểm kết nạp.
* **BR_MEM_02 (Trạng thái hoạt động)**: Chỉ đoàn viên có trạng thái `Đang sinh hoạt` mới được tham gia các hoạt động bình xét thi đua và nhận phúc lợi định kỳ.
* **BR_MEM_03 (Chuyển sinh hoạt công đoàn)**: Khi chuyển công đoàn bộ phận, toàn bộ lịch sử đóng đoàn phí và thành tích thi đua của đoàn viên đó phải được lưu vết và chuyển tiếp sang đơn vị mới, không được xóa bỏ hoặc reset.
* **BR_MEM_04 (Miễn sinh hoạt)**: Đoàn viên nghỉ thai sản, nghỉ ốm dài ngày (trên 3 tháng) hoặc đi học tập tập trung trên 6 tháng có thể được chuyển trạng thái sang `Miễn sinh hoạt` tạm thời (không tính chỉ tiêu thi đua và được miễn đóng đoàn phí trong thời gian này).

## 2. Quy định về Tài chính (Financial Rules)
* **BR_FIN_01 (Mức đóng Đoàn phí)**: 
  * Đoàn phí đóng hàng tháng bằng **1%** lương đóng bảo hiểm xã hội (hoặc lương cơ bản theo ngạch bậc quân y/hành chính tại bệnh viện).
  * Đối với các đối tượng lao động hợp đồng, mức đóng đoàn phí tối đa không vượt quá 10% mức lương tối thiểu vùng.
* **BR_FIN_02 (Tỷ lệ phân bổ ngân sách)**:
  * Tổng số đoàn phí thu về từ đoàn viên sẽ được phân bổ theo tỷ lệ:
    * **40%** nộp về Công đoàn cấp trên (CĐCS nộp về Công đoàn Quốc phòng).
    * **60%** giữ lại tại công đoàn cơ sở để chi các hoạt động tại cơ sở, trong đó:
      * **30%** giữ lại tại quỹ CĐCS phục vụ các hoạt động chung toàn bệnh viện.
      * **30%** trích trả lại cho CĐBP và Tổ công đoàn thực hiện chi trực tiếp cho đoàn viên.
* **BR_FIN_03 (Hạn mức chi tiêu)**:
  * Các khoản chi hỗ trợ, thăm hỏi phải tuân thủ đúng định mức chi quy định trong Quy chế chi tiêu nội bộ của Công đoàn bệnh viện:
    * Thăm hỏi đoàn viên ốm đau nằm viện: 500.000 VNĐ/lần (tối đa 2 lần/năm).
    * Trợ cấp hoàn cảnh đặc biệt khó khăn (mắc bệnh hiểm nghèo): Từ 2.000.000 VNĐ đến 5.000.000 VNĐ/lần (CĐCS duyệt).
    * Chi chúc mừng hiếu hỷ (đoàn viên kết hôn): 1.000.000 VNĐ.
    * Phúng viếng tứ thân phụ mẫu qua đời: 1.000.000 VNĐ.

## 3. Quy định về Thi đua & Bình xét (Award & Evaluation Rules)
* **BR_AWD_01 (Tỷ lệ khống chế khen thưởng)**:
  * Tỷ lệ đoàn viên xuất sắc được khen thưởng cấp CĐCS không vượt quá **15%** tổng số đoàn viên của CĐBP đó.
  * Tỷ lệ khen thưởng cấp Tổ công đoàn không vượt quá **20%** tổng số đoàn viên trong tổ.
* **BR_AWD_02 (Điều kiện xét khen thưởng)**:
  * Đoàn viên được xếp loại "Đoàn viên xuất sắc" bắt buộc phải đóng đoàn phí đầy đủ 12 tháng trong năm và không bị kỷ luật từ mức Khiển trách trở lên.
  * Phải tham gia tối thiểu 80% các hoạt động phong trào do Tổ công đoàn hoặc CĐBP tổ chức trong năm.

## 4. Quy định về Bảo mật & Kiểm soát (Security & Audit Rules)
* **BR_SEC_01 (Xác thực hai lớp)**: Các thao tác liên quan đến duyệt chi tài chính trên 10.000.000 VNĐ hoặc thay đổi phân quyền hệ thống bắt buộc phải xác thực thông qua mã OTP (gửi qua email hoặc app di động).
* **BR_SEC_02 (Lưu nhật ký hệ thống)**: Mọi thao tác thêm, xóa, sửa hồ sơ đoàn viên, phê duyệt tài chính bắt buộc phải ghi log chi tiết (Ai thực hiện, thời gian, dữ liệu trước và sau khi thay đổi). Log này không được phép xóa (Read-only và Append-only).
