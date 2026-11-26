# Bảo vệ dữ liệu QLCD

| Nhóm | Ví dụ trong QLCD | Kiểm soát và phần cần quyết định |
| --- | --- | --- |
| Công khai đã duyệt | Nội dung giới thiệu dùng chung đã công bố | Chỉ phát hành nội dung chủ dữ liệu đã duyệt. Danh sách đơn vị nội bộ và số liệu nghiệp vụ mặc định thuộc nhóm nội bộ. |
| Nội bộ | Cơ cấu, danh mục và báo cáo đã tổng hợp | Phiên staff và phạm vi tổ chức. Rà nhóm thống kê quá nhỏ có thể suy ra danh tính trước khi chia sẻ. |
| Cá nhân | Họ tên, ngày sinh, căn cước, điện thoại, email, địa chỉ, mã nhân viên | Hồ sơ đoàn viên nằm trong SQL. DTO danh sách giảm trường định danh. DTO chi tiết phục vụ tra cứu trong phạm vi và có audit đọc. Chỉ mở thêm trường sau khi xác định mục đích, vai trò và thời hạn. |
| Cá nhân có khả năng nhạy cảm | Tôn giáo, dân tộc, thông tin chính trị, dữ liệu trong hồ sơ phúc lợi và PDF | Xử lý theo phân loại thận trọng cho đến khi đầu mối dữ liệu xác định danh mục pháp lý. Giới hạn trường tự do, đầu mối xử lý và chia sẻ. Chỉ dùng hồ sơ và PDF tổng hợp khi kiểm thử. |
| Mật | Khóa TOTP/Data Protection, mật khẩu, mã kích hoạt, token, backup và log có định danh | Cookie HttpOnly, hash mật khẩu/token/mã, khóa TOTP được bảo vệ bằng Data Protection. Cô lập log, sao lưu và key ring. Chỉ cho phép người có nhiệm vụ được duyệt truy cập. |

## Truy cập và lưu trữ

- Kiểm cả quyền chức năng và phạm vi đối tượng tại API. Hồ sơ, SQL, tệp minh chứng và key ring cần quyền truy cập riêng. Giữ TLS đến ingress và SQL. Bằng chứng hiện có chưa xác nhận mã hóa đĩa, SQL backup và volume trên môi trường đích.
- PDF nằm ở kho riêng, tải dưới dạng attachment sau khi đối chiếu module, bản ghi và đơn vị. Tệp cũ và backup cần đối soát. Trình duyệt truy cập link chứng chỉ qua origin HTTPS cho phép. Quyền tại kho chứng chỉ nằm ngoài QLCD và cần xác minh cùng chủ tích hợp.
- Repo hiện không có đầu ra Excel hoặc CSV trực tiếp trong các controller đã kiểm kê. Khi bổ sung, lấy dữ liệu qua cùng scope, chỉ lấy cột được duyệt, xử lý chuỗi nhập dưới dạng ô văn bản và ghi audit. Quản lý tệp xuất theo vòng đời, kể cả bản tải xuống và thư mục tạm.
- Audit mới ghi actor, ID đối tượng, hành động, UTC và trace cho đọc hồ sơ và tải minh chứng. API log ghi kết quả yêu cầu. Cần hạn chế quyền xem log và chuyển bản sao sang nơi lưu có kiểm soát chống sửa. Review nguồn log, crash dump, backup và ảnh chụp trước khi chia sẻ.

## Quy trình của chủ dữ liệu

1. Lập sổ xử lý gồm mục đích, căn cứ, nhóm người có dữ liệu, vai trò/cá nhân nhận dữ liệu, nơi lưu, thời hạn và bên xử lý. Kiểm riêng tệp minh chứng, dữ liệu nhạy cảm và chia sẻ ra ngoài hệ thống. Ghi bằng chứng quyết định trước khi thay đổi biểu mẫu hoặc trường thu thập.
2. Đầu mối bảo vệ dữ liệu nhận và xác minh yêu cầu của chủ thể, ghi phạm vi và hạn xử lý, yêu cầu người vận hành thực hiện và ghi bằng chứng trả lời. Rà nghĩa vụ lưu trữ, điều tra và bảo toàn chứng cứ trước khi sửa, xuất hoặc xóa. Xóa mềm là trạng thái nghiệp vụ và vẫn giữ dữ liệu trong SQL.
3. Duyệt lịch giữ và hủy cho hồ sơ, tài khoản, tệp đã gắn, log, bản sao và phiên. Hiện có lệnh dọn phiên và tệp pending theo cấu hình. Chưa có cơ chế hủy đồng bộ hồ sơ đã xóa mềm, tệp liên quan và bản sao cũ. Phục hồi cần đối soát các yêu cầu xóa/sửa phát sinh sau thời điểm sao lưu.

Đầu mối pháp chế và bảo vệ dữ liệu xác nhận nghĩa vụ theo loại dữ liệu và hoạt động thực tế. Đây là hồ sơ kỹ thuật đầu vào cho thẩm định. [Luật 91/2025/QH15](https://vanban.chinhphu.vn/?docid=214590&pageid=27160) · [Nghị định 356/2025/NĐ-CP](https://vanban.chinhphu.vn/?docid=216387&pageid=27160)
