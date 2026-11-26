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

## Quy chuẩn bắt buộc cho các lần phát triển tiếp theo

Mọi thay đổi UI áp dụng quy chuẩn này và [skill UI/UX](../.agents/skills/qlcd-ui-ux/SKILL.md). Tái sử dụng component trước khi tạo mới; ngoại lệ phải nêu lý do nghiệp vụ trong báo cáo. Thay đổi giao diện không đổi API, nghiệp vụ, số liệu, phạm vi hoặc xác thực. Không tự thêm tổng số/trang cuối cho API chỉ trả `hasMore`.

| Loại màn hình | Cấu trúc và thành phần thực tế |
| --- | --- |
| Danh sách | Tiêu đề → thao tác chính → tìm kiếm/bộ lọc → `.panel` + `DataTable` → `ListPager`. Đoàn viên là mẫu danh sách có tổng số; Hoạt động là mẫu API `hasMore`. |
| Tạo/sửa | `FormDialog`, label gắn với control, nhóm field cùng ý nghĩa, lỗi tại form, Lưu/Hủy cuối form. Dưới 640 px, grid 2/3 cột trong dialog về một cột. Giữ validation và khóa thao tác khi đang gửi. |
| Chi tiết | Hồ sơ đoàn viên dùng nhóm thông tin và lịch sử, thao tác theo quyền. Giữ liên kết quay lại danh sách. |
| Xác nhận | `useConfirmation` + `FormDialog` + `DialogCloseButton`; X/Escape/Hủy không gửi ghi. Không dùng `window.confirm`. |
| Cây | Giữ cấu trúc và nhóm khối của Organizations; tên dài xuống dòng, nút mở/thu và chọn có tên truy cập. Không tạo node giả hoặc tải danh sách để thay scope. |
| Dashboard/báo cáo | Tận dụng `Distribution`, thẻ `.panel`, nhãn và số bằng văn bản; bộ lọc năm dùng input có label. Các số thống kê không được tính lại theo trang nếu API cung cấp tổng. |
| Tải/rỗng/lỗi/kết quả | `LoadState`, hàng rỗng có `colSpan` đúng và `Notice`. Giữ nút thử lại và phản hồi lỗi quyền/phiên. Không để trạng thái tải bị hiểu thành dữ liệu rỗng. |

### Hướng dẫn component dùng chung

`DataTable` nhận `label`, `children` là bảng native hiện có và `footer` là `ListPager`. Component sở hữu hai trục cuộn; footer nằm ngoài cả hai trục. Không đặt pager trong `table`, `tbody` hoặc `.data-table-scroll`. Bảng giữ `scope="col"`, tên vùng cuộn và focus bàn phím. Không thay toàn bộ cột/DTO chỉ để sử dụng wrapper.

```tsx
<DataTable label="Bảng hoạt động" footer={
  <ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />
}>
  <table>{/* thead có scope, tbody và trạng thái hiện có */}</table>
</DataTable>
```

`ListPager` giữ Trước/Sau theo `hasMore`, khóa khi tải. Chỉ truyền `totalCount` và `pageSize` khi server thật sự trả chúng (Đoàn viên). Tìm kiếm/bộ lọc và đổi số dòng đưa về trang 1. Xóa thành công bản ghi cuối trang >1 đưa về trang trước; lỗi không đổi trang. Không tải 10.000 bản ghi về để phân trang client.

`TableText` dùng cho nội dung bảng dài: tối đa 120 ký tự xem trước; native details cho phép Xem đầy đủ/Thu gọn bằng chuột, cảm ứng và bàn phím. Văn bản ngắn/null không thêm thao tác. Không đặt details trong link hoặc button. Tên dài trong link được xuống dòng; không chỉ dùng tooltip hover cho thông tin cần đọc trên điện thoại.

Giữ `MemberSelect` tìm đoàn viên phía server; không tạo dropdown tải mọi đoàn viên. `ManagementBlocksPanel`, `MemberCreateDialog`, `EvidenceUpload` tiếp tục xử lý các biểu mẫu tương ứng. Không tạo SearchBar/FormLayout mới chỉ để đổi tên các control đang đủ chức năng.

### Token, kích thước và cuộn

Nguồn chuẩn là [globals.css](../frontend/qlcd-web/src/app/globals.css), không sao chép bảng màu vào từng trang. Các màu `brand`, `ink`, `copy`, `muted`, `surface`, `line`, `edge` và màu trạng thái giữ ý nghĩa hiện có. Font hệ thống hỗ trợ tiếng Việt; bảng chính 14 px, văn bản phụ dùng token/kích thước hiện có. `.panel` dùng viền, radius và shadow chung.

- `--ui-control-height`: 2,75 rem cho control cần vùng bấm 44 px; nút bảng tối thiểu 2 rem, nút X 44 px.
- `--ui-table-height`: 36 rem; vùng bảng dùng `clamp(14rem, calc(100dvh - 25rem), var(--ui-table-height))`. Trang vẫn cuộn để tiếp cận footer khi toolbar cao.
- `--ui-table-width`: 56 rem; bảng rộng cuộn tại vùng bảng, không làm tràn tài liệu. Cell giới hạn chiều rộng và ngắt chuỗi không có khoảng trắng.
- `--ui-layer-table-header`: 1 cho header bảng sticky; header ứng dụng dùng lớp 10, native dialog thuộc top layer.
- Dialog dùng `max-height: calc(100dvh - 2rem)`, chiều rộng màn hình trừ 2 rem, `max-w-lg` hoặc `max-w-2xl`; cuộn trong dialog, nút X sticky. Phải cuộn tới Lưu/Hủy, không yêu cầu footer sticky nếu làm che trường nhập.
- Sidebar đổi sang điều hướng dialog dưới 1024 px; các breakpoint còn lại dùng Tailwind hiện có. Focus hiển thị, giảm animation theo reduced motion. Không dùng overflow hidden để che lỗi bố cục.

### UI/UX Quality Gate

Trước khi bàn giao, kiểm tra component dùng chung trên mọi nơi sử dụng bị ảnh hưởng; không chỉ màn hình mới. Mỗi thay đổi phải có bằng chứng lệnh, kết quả và giới hạn trong [TASK_TRACKER](TASK_TRACKER.md).

1. Soát route và quyền liên quan; giữ hợp đồng UI → API → handler → SQL. Chỉ dùng fixture tổng hợp cô lập, không sửa database thật để tạo stress data.
2. Kiểm 0, 1, 5–10, 20–50, 100–500 và 1.000–10.000 bản ghi khi phù hợp; văn bản dài, chuỗi không khoảng trắng, tiếng Việt, null hợp lệ, số lớn, cây nhiều cấp và trạng thái khác nhau. Phân biệt tổng dữ liệu và số DOM render.
3. Kiểm tổng số nếu có, trang trước/sau, trang cuối, số dòng 10/20/50/100 khi API hỗ trợ, lọc/tìm kiếm reset trang và xóa hàng cuối trang. Không trùng/bỏ hàng giữa các trang.
4. Kiểm cả hai trục cuộn, header bảng, pager, cột thao tác và khả năng đọc nội dung dài. Dialog không tràn viewport; Lưu/Hủy/X, Escape, focus vào/ra và đóng lớp trên cùng hoạt động đúng.
5. Kiểm 1920×1080, 1600×900, 1440×900, 1366×768, 1280×720, 1024×768 và mobile/tablet. Thử zoom thật 80/100/125/150/200% khi nghiệm thu; viewport tương đương trong automation chỉ chứng minh reflow, không thay thế zoom thật.
6. Kiểm loading/empty/error/retry/denied, console/network, độ trễ, DOM chỉ giữ một trang, request cũ bị hủy. Chỉ tối ưu memo/virtualization nếu có số đo chứng minh cần thiết.
7. Chạy lint/typecheck/production build, `test:ui` và browser smoke hiện có; backend build/test và HTTP smoke theo [TESTING](TESTING.md). CI giữ báo cáo/ảnh UI. Không báo đã đạt nếu lệnh thất bại; ghi rõ lỗi có trước và chặn nghiệm thu đầy đủ.

Các kiểm tra thủ công bổ sung: zoom trình duyệt thật, touchpad/cảm ứng trên thiết bị thật, screen reader và trình duyệt ngoài Chromium. Screenshot chỉ dùng fixture tổng hợp, không chụp bí mật hoặc hồ sơ thật.
