# Thiết kế giao diện QLCD

QLCD dùng xanh cô-ban `#1457ad` cho thao tác chính, xanh đậm cho điều hướng, vàng `#f4c567` làm điểm nhấn và đỏ `#a0273a` cho cảnh báo hoặc thao tác xóa. Nền `#f4f7fc` và bảng, biểu mẫu màu trắng giúp tách rõ các vùng làm việc. Trạng thái dùng cả màu và nhãn văn bản. Bảng màu lấy cảm hứng từ nhận diện Công đoàn Việt Nam. [Tiêu chuẩn thiết kế hiện hành của ứng dụng](../frontend/qlcd-web/src/app/globals.css) · [Hướng dẫn 38/HD-TLĐ](https://congdoancaosu.vn/wp-content/uploads/2025/04/38HD-TLD.pdf)

Dùng `.panel` cho vùng chứa dữ liệu, font hệ thống hỗ trợ tiếng Việt và Lucide cho điều hướng. Các trang dùng token `brand`, `ink`, `copy`, `muted`, `surface` và `line`. Biểu mẫu dùng `edge` cho viền ô nhập. Ảnh nhân viên y tế ở trang đăng nhập và tổng quan là ảnh minh họa được tạo cho ứng dụng.

| Thành phần | Cách dùng |
| --- | --- |
| Shell | Sidebar 252 px từ 1024 px. Dưới 1024 px, mở điều hướng từ header bằng native dialog. Trang hiện tại có `aria-current`. |
| Cấu trúc trang | Tiêu đề 24–30 px và khoảng cách nội dung 16–24 px. Main có max-width để đọc dễ ở 1920 px. |
| Form | Gắn label với control. Nhóm field xuống một cột trên mobile khi cần. Lỗi và thao tác lưu nằm trong vùng có focus. |
| Dialog | Dùng `FormDialog` để giới hạn chiều cao và cuộn nội dung. Escape đóng khi thao tác lưu đã kết thúc. |
| Bảng | Dùng `scope` cho tiêu đề cột. Cuộn ngang bên trong bảng rộng. Dùng văn bản để biểu thị trạng thái. |
| Tải và lỗi | `LoadState` có vùng trạng thái hoặc cảnh báo và nút thử lại. `Notice` hiển thị kết quả lưu và hỗ trợ đóng bằng bàn phím. |
| Biểu đồ | Tổng quan có nhãn và số bằng văn bản. Thanh biểu thị tỷ lệ hỗ trợ đọc. Định dạng số theo `vi-VN`. |

Đánh giá khả năng truy cập theo WCAG 2.2 AA. Kiểm tra focus, tên accessible, tương phản, reduced motion và thao tác bàn phím. Axe và Chromium ghi nhận các trang đã đo. Screen reader, trình duyệt khác và thiết bị thật cần nghiệm thu riêng. [WCAG 2.2](https://www.w3.org/TR/WCAG22/) · [Kịch bản trình duyệt](../frontend/qlcd-web/tests/browser.mjs)

## Đóng và hủy xác nhận

Các hộp thoại biểu mẫu và xác nhận dùng nút X chung ở góc trên bên phải, tên truy cập “Đóng hộp thoại”, vùng bấm 44×44 px và focus hiển thị. Nút ở trong vùng sticky để vẫn tiếp cận được khi nội dung cuộn. X có `type="button"`, chỉ gọi nhánh đóng/hủy; không submit biểu mẫu. Escape và nút Hủy có cùng ý nghĩa. Khi đang gửi dữ liệu, khóa X và Escape đến khi có kết quả. Khi đóng, trả focus về nút mở nếu còn trên trang.

Xác nhận xóa dùng `useConfirmation`: chỉ “Đồng ý” trả về chấp thuận. X, Escape, Hủy hoặc unmount trả về từ chối. Hủy hộp xác nhận xóa tệp nằm trong biểu mẫu không đóng biểu mẫu cha. Bước tạo lại mã khôi phục có cùng nút X để bỏ dữ liệu nhập trước khi gửi; xác thực bắt buộc vẫn giữ nguyên. Đóng phần hiển thị kết quả đã hoàn tất không hoàn tác thao tác đã thực hiện.

Khối quản lý hiển thị bằng group header trong danh sách con của mỗi đơn vị và nhãn trên từng node; không dùng button/node giả để mô phỏng một cấp tổ chức. Chưa phân khối là nhãn cho giá trị null, không phải một khối được tạo sẵn. Form tạo luôn có placeholder yêu cầu lựa chọn rõ; form sửa giữ khối ngừng dùng hiện có, không ép chuyển hoặc tự chọn khối thay thế. Danh mục khối dùng FormDialog có X/Hủy, label và xác nhận ngừng sử dụng; không có thao tác xóa liên kết.
