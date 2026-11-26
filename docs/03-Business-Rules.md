# 03. BUSINESS RULES - QUY ĐỊNH NGHIỆP VỤ

Tài liệu này tổng hợp toàn bộ các quy tắc ràng buộc logic nghiệp vụ bắt buộc phải được kiểm tra (validate) trên Backend.

## 1. Ràng buộc về Cấu trúc Tổ chức (BR_ORG)
* **BR_ORG_01 (CĐCS Duy nhất)**: Toàn bộ hệ thống chỉ được phép tồn tại duy nhất 01 bản ghi thuộc loại `CĐCS` (Công đoàn Cơ sở Bệnh viện TWQĐ 108).
* **BR_ORG_02 (CĐBP trực thuộc CĐCS)**: Mọi Công đoàn Bộ phận (`CDBP`) bắt buộc phải có đơn vị cha là `CDCS`. Một CĐBP có thể có 0, 1 hoặc nhiều tổ công đoàn. Không được phép có CĐBP con hoặc lồng nhau.
* **BR_ORG_03 (Vị trí của Tổ công đoàn trực thuộc CĐCS)**: Tổ trực thuộc CĐCS phải có cha trực tiếp là `CDCS`.
* **BR_ORG_04 (Vị trí của Tổ công đoàn thuộc CĐBP)**: Tổ công đoàn thuộc CĐBP bắt buộc phải có cha trực tiếp là `CDBP`.
* **BR_ORG_05 (Không có cấp 4)**: Tuyệt đối không cho phép tạo bất kỳ tổ chức con nào dưới Tổ công đoàn (Level 3 hoặc nút lá).
* **BR_ORG_06 (Ngừng hoạt động và khôi phục)**: Không hard-delete đơn vị, tài khoản hoặc quan hệ nghiệp vụ. Gỡ khỏi cây là đặt `TrangThai=0`, không đặt `IsDeleted` cho bản ghi mới. Giữ ID, cha–con, đoàn viên và toàn bộ dữ liệu. Chặn ngừng CĐCS và mọi đơn vị có con, kể cả con đã ngừng hoặc soft-delete cũ; không cascade trạng thái. Cho phép ngừng đơn vị lá có đoàn viên/nghiệp vụ vì dữ liệu được bảo toàn. Cây chính chỉ hiển thị đơn vị có cả chuỗi tổ tiên hoạt động. Danh sách ngừng hoạt động riêng cho ADMIN/CDCS hỗ trợ khôi phục cùng ID, cha phải hoạt động trước. Khôi phục không mở khóa tài khoản.
* **BR_ORG_08 (Tách khóa tài khoản)**: `TaiKhoan.TrangThai` là cờ khóa riêng, không đồng bộ với trạng thái đơn vị. Tài khoản gắn đơn vị/cha ngừng hoặc bị ẩn vẫn hiển thị quản trị nhưng bị chặn truy cập (`organizationActive=false`, `canSignIn=false`) dù cờ khóa riêng đang mở. Mở khóa chỉ thay trạng thái/tombstone cũ của chính tài khoản và SecurityVersion, không đổi đơn vị. Ngừng/khôi phục đơn vị thu hồi phiên bằng SecurityVersion; không đổi mật khẩu, MFA, quan hệ hoặc cờ khóa tài khoản.


* **BR_ORG_07 (Giữ dữ liệu nhập khi tạo mới)**: Tên đơn vị được lưu đúng chuỗi người dùng nhập, không thêm CDS/CDCS, TCD/TOCD hay CDBP và không tự cắt các từ này nếu người dùng đã nhập. API hiện dùng ID GUID, không có trường mã đơn vị dạng chuỗi. Tên đăng nhập tự sinh chỉ chuẩn hóa tên sang chữ thường không dấu, phân cách bằng `_`, tối đa 36 ký tự gốc; không thêm tiền tố vai trò hay bỏ các cụm từ chỉ loại đơn vị. Nếu trùng tên đăng nhập, thêm `_1`, `_2`…; nếu không có ký tự dùng được, dùng `don_vi`. Chỉ áp dụng lúc tạo mới, không đổi tên, ID hay tài khoản hiện có.

## 2. Ràng buộc về Đoàn viên & Biến động (BR_MEM)
* **BR_MEM_01 (Trùng lặp CCCD/Mã NV)**: Số CCCD/CMTQĐ và Mã nhân viên của đoàn viên phải là duy nhất trên toàn bộ hệ thống.
* **BR_MEM_02 (Vào Công đoàn)**: Ngày vào Công đoàn không được lớn hơn ngày hiện tại.
* **BR_MEM_03 (Phân bổ đoàn viên)**: Khi thêm hồ sơ, chọn tổ công đoàn đang hoạt động (trực thuộc CĐCS hoặc CĐBP) hoặc chọn trực tiếp CĐBP đang hoạt động chưa có tổ. Tổ đã ngừng hoạt động vẫn được tính nếu còn trong cơ cấu. Hồ sơ tiếp nhận trực tiếp trước đó tiếp tục thuộc CĐBP sau khi lập tổ. Dùng chức năng chuyển sinh hoạt nếu cần đưa đoàn viên về tổ.
* **BR_MEM_04 (Transaction Chuyển sinh hoạt)**: Thao tác chuyển đoàn viên giữa các đơn vị bắt buộc phải nằm trong một Database Transaction để đảm bảo tính toàn vẹn số liệu thống kê.

## 3. Ràng buộc về Tài chính, Thi đua & Phúc lợi (BR_FIN_AWD)
* **BR_FIN_01 (Tự động thống kê số dư)**: Không cho phép người dùng sửa đổi thủ công số lượng đoàn viên của các đơn vị. Các chỉ số này phải được tính toán tự động bằng cách Count số đoàn viên đang hoạt động thực tế.
* **BR_AWD_01 (Tỷ lệ khen thưởng)**: Số lượng đoàn viên được đề xuất xếp loại "Đoàn viên xuất sắc" ở cấp CĐBP không vượt quá 15% tổng số đoàn viên thực tế của CĐBP đó.

## 4. Xác thực tài khoản

- Tài khoản mới dùng mật khẩu khởi tạo `123456aA@` đã băm và mã kích hoạt riêng. Người dùng liên kết Authenticator, lưu mã khôi phục và đổi mật khẩu trước khi vào nghiệp vụ.
- Mọi tài khoản dùng mật khẩu và OTP để đăng nhập. Tài khoản cũ chưa có Authenticator giữ mật khẩu hiện tại và dùng mã thiết lập do người được cấp quyền bàn giao.
- Đổi mật khẩu cần mật khẩu hiện tại, xác nhận mật khẩu mới và OTP mới. Mật khẩu mới có 8–128 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt, đồng thời khác mật khẩu hiện tại và mật khẩu khởi tạo. Khôi phục bằng mã yêu cầu liên kết thiết bị mới rồi đăng nhập lại.
- Chỉ `qlcd_admin` có ID đã cấu hình được đặt lại mật khẩu hoặc 2FA cho tài khoản khác. Hai thao tác độc lập, yêu cầu xác nhận và OTP mới, thu hồi phiên đích và được ghi audit. Cấp mã kích hoạt sau khi xác minh danh tính qua kênh tin cậy. [Luồng xác thực](AUTHENTICATION.md) · [Quy trình khôi phục](ACCOUNT_RECOVERY.md)

## 5. Khối quản lý

- Dùng thực thể/bảng `KhoiChuyenMon` và FK `DonViCongDoan.MaKhoi` hiện có làm nguồn chuẩn, với nhãn giao diện **Khối quản lý**. Không tạo thêm đơn vị, tài khoản, cấp tổ chức hoặc phạm vi quyền theo khối.
- ADMIN được tạo/sửa tên (1–100 ký tự, duy nhất), ghi chú (tối đa 500 ký tự) và trạng thái sử dụng. Các vai trò nghiệp vụ được đọc danh sách tên/trạng thái; số đơn vị liên kết toàn hệ thống chỉ trả cho ADMIN.
- Không cung cấp xóa khối. Ngừng sử dụng cần xác nhận, giữ nguyên bản ghi và tất cả liên kết, kể cả đơn vị đã ngừng/lưu trữ cũ. Chỉ không cho chọn khối đó khi tạo hoặc đổi phân loại mới. Đơn vị đang liên kết được giữ nguyên khối khi sửa thông tin khác.
- Mọi đơn vị mới, kể cả CĐCS, phải chọn khối đang dùng; không tự chọn khối đầu tiên hay suy ra từ tên/đơn vị cha. Đơn vị cũ chưa có MaKhoi giữ null và hiển thị **Chưa phân khối**. Có thể sửa thông tin cũ mà chưa phân loại; ADMIN/CDCS chọn khối phù hợp trong Sửa đơn vị để bổ sung sau kiểm tra. Sau khi đã phân loại, không được xóa liên kết về null qua form/API.
- Cây phân nhóm các đơn vị cùng cha theo khối, kèm nhãn khối của mỗi đơn vị. Group header không phải node đơn vị, không thay MaParent/ID/quyền truy cập. Thống kê khối tính theo phân loại của chính đơn vị, không cộng lại theo khối của cha.
- Ngừng/khôi phục đơn vị giữ nguyên MaKhoi; khóa/mở tài khoản không thay khối; sửa/ngừng khối không thay trạng thái đơn vị, tài khoản hay phiên/quyền của họ. Khối ngừng dùng không chặn nghiệp vụ của đơn vị đang hoạt động.
- Các dòng DanhMucDungChung loại KhoiChuyenMon cũ được bảo toàn và chỉ đọc (GET catalogs legacy), không tự đối sánh/ghép ID theo tên. Không tạo/sửa/xóa thêm dòng khối qua API danh mục chung; dùng management-blocks. Không tiếp tục seed nguồn danh mục trùng này.
