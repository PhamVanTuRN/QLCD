# 03. BUSINESS RULES - QUY ĐỊNH NGHIỆP VỤ

Tài liệu này tổng hợp toàn bộ các quy tắc ràng buộc logic nghiệp vụ bắt buộc phải được kiểm tra (validate) trên Backend.

## 1. Ràng buộc về Cấu trúc Tổ chức (BR_ORG)
* **BR_ORG_01 (CĐCS Duy nhất)**: Toàn bộ hệ thống chỉ được phép tồn tại duy nhất 01 bản ghi thuộc loại `CĐCS` (Công đoàn Cơ sở Bệnh viện TWQĐ 108).
* **BR_ORG_02 (CĐBP trực thuộc CĐCS)**: Mọi Công đoàn Bộ phận (`CDBP`) bắt buộc phải có đơn vị cha là `CDCS`. Không được phép có CĐBP con hoặc lồng nhau.
* **BR_ORG_03 (Vị trí của Tổ công đoàn trực thuộc CĐCS)**: Tổ trực thuộc CĐCS phải có cha trực tiếp là `CDCS`.
* **BR_ORG_04 (Vị trí của Tổ công đoàn thuộc CĐBP)**: Tổ công đoàn thuộc CĐBP bắt buộc phải có cha trực tiếp là `CDBP`.
* **BR_ORG_05 (Không có cấp 4)**: Tuyệt đối không cho phép tạo bất kỳ tổ chức con nào dưới Tổ công đoàn (Level 3 hoặc nút lá).
* **BR_ORG_06 (Chặn xóa tổ chức có dữ liệu)**: Không cho phép xóa vật lý (Hard Delete) bất kỳ đơn vị tổ chức nào nếu đơn vị đó đang chứa tổ chức con, đoàn viên, giao dịch tài chính, hoạt động công đoàn, hoặc khen thưởng/kỷ luật liên quan. Chỉ được phép chuyển sang trạng thái `Ngừng hoạt động`.

## 2. Ràng buộc về Đoàn viên & Biến động (BR_MEM)
* **BR_MEM_01 (Trùng lặp CCCD/Mã NV)**: Số CCCD/CMTQĐ và Mã nhân viên của đoàn viên phải là duy nhất trên toàn bộ hệ thống.
* **BR_MEM_02 (Vào Công đoàn)**: Ngày vào Công đoàn không được lớn hơn ngày hiện tại.
* **BR_MEM_03 (Phân bổ Đoàn viên)**: Đoàn viên bắt buộc phải thuộc một Tổ công đoàn hợp lệ. Không được gán đoàn viên trực tiếp vào CĐCS hoặc CĐBP mà không qua Tổ công đoàn cụ thể.
* **BR_MEM_04 (Transaction Chuyển sinh hoạt)**: Thao tác chuyển đoàn viên giữa các đơn vị bắt buộc phải nằm trong một Database Transaction để đảm bảo tính toàn vẹn số liệu thống kê.

## 3. Ràng buộc về Tài chính, Thi đua & Phúc lợi (BR_FIN_AWD)
* **BR_FIN_01 (Tự động thống kê số dư)**: Không cho phép người dùng sửa đổi thủ công số lượng đoàn viên của các đơn vị. Các chỉ số này phải được tính toán tự động bằng cách Count số đoàn viên đang hoạt động thực tế.
* **BR_AWD_01 (Tỷ lệ khen thưởng)**: Số lượng đoàn viên được đề xuất xếp loại "Đoàn viên xuất sắc" ở cấp CĐBP không vượt quá 15% tổng số đoàn viên thực tế của CĐBP đó.
