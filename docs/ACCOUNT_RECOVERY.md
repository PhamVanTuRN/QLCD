# Khôi phục tài khoản và Authenticator

## Mất hoặc đổi điện thoại

```mermaid
flowchart TD
    A[Mất Authenticator] --> B{Còn mật khẩu và một mã khôi phục?}
    B -- Có --> C[Nhập mật khẩu và chọn Dùng mã khôi phục]
    C --> D[Quét QR mới và xác nhận OTP của thiết bị mới]
    B -- Không --> E[qlcd_admin đối chiếu danh tính qua hồ sơ và kênh riêng]
    E --> F[qlcd_admin xác thực lại bằng mật khẩu và OTP]
    F --> G[Đặt lại 2FA và giao mã kích hoạt mới]
    G --> D
    D --> H[Thu hồi thông tin cũ và lưu bộ mã mới]
    H --> I[Hoàn tất đổi mật khẩu khi được yêu cầu và đăng nhập lại]
```

Mã khôi phục cho phép yêu cầu QR thay thế sau khi đã xác minh mật khẩu. Khi người dùng chứng minh đã đăng ký thiết bị mới, hệ thống tiêu thụ bộ mã cũ, thay khóa TOTP, tạo 10 mã mới và thu hồi phiên cũ. Người dùng hoàn tất đăng nhập lại bằng OTP của thiết bị mới. Nếu vẫn còn Authenticator, có thể tạo lại bộ mã trong **Bảo mật tài khoản** bằng mật khẩu và OTP mới.

## Quên mật khẩu hoặc mất cả bộ mã

Chỉ `qlcd_admin` có ID được cấu hình thấy hai thao tác trong **Tài khoản** cho tài khoản khác. Đối chiếu danh tính từ hồ sơ nội bộ và liên hệ qua đầu mối đã có của đơn vị.

- **Đặt lại mật khẩu** cấp lại `123456aA@` có hạn 24 giờ và yêu cầu đổi khi đăng nhập. Người dùng tiếp tục xác thực bằng Authenticator đã liên kết.
- **Đặt lại 2FA** thu hồi khóa Authenticator, bước OTP và mã khôi phục cũ, đồng thời giữ mật khẩu hiện tại. Xác nhận đã đối chiếu danh tính và giao riêng mã kích hoạt dùng một lần có hạn 24 giờ qua kênh tin cậy. Dùng lại thao tác này để cấp mã mới khi mã đã cấp hết hạn.

Xác nhận từng thao tác và nhập mật khẩu cùng OTP mới của `qlcd_admin`. Mỗi lần thành công làm hết hiệu lực các phiên của tài khoản đích và ghi audit `AUTH_PASSWORD_RESET` hoặc `AUTH_MFA_RESET` với người thực hiện và tài khoản đích. Nếu mất cả mật khẩu và Authenticator, thực hiện từng thao tác với OTP khác nhau.

Khi chính `qlcd_admin` mất quyền truy cập, người vận hành được cấp quyền trên máy chủ xác minh danh tính và dùng `--provision-account` với `Bootstrap__Username=qlcd_admin`, ID đã cấu hình và mã mới 32 ký tự hex qua `Bootstrap__ActivationCode`. Lệnh khôi phục khẩn cấp đặt lại cả mật khẩu và Authenticator của tài khoản này. Giao mã riêng cho chủ tài khoản và dọn biến cấp tạm sau thao tác. [Triển khai và khôi phục](SECURITY.md)

## Thống nhất kết quả đặt lại

Reset mật khẩu không khác nhau theo vai trò CDCS, CDBP, TOCD hay ADMIN khác: tất cả trở về `123456aA@` trong 24 giờ và bắt buộc đổi trước khi vào nghiệp vụ. Cả hai thao tác reset giữ trạng thái khóa; nếu tài khoản đang khóa, admin phải mở khóa riêng khi được phép. Reset 2FA hoặc cấp mã cho tài khoản cũ giữ mật khẩu hiện tại vì đó là thao tác phục hồi thiết bị, không phải đặt lại mật khẩu. CLI khôi phục khẩn cấp quản trị viên đặt lại cả hai; xem bảng đối chiếu trong [kiến trúc xác thực](AUTHENTICATION.md#mật-khẩu-khởi-tạo-và-các-luồng-quản-trị).

Màn hình Tài khoản hiển thị mật khẩu khởi tạo từ chính sách backend, nêu giá trị và thời hạn trước khi xác nhận reset, rồi thông báo tài khoản nào đã được reset cùng kết quả chính xác. Người dùng ở bước đổi mật khẩu bắt buộc được nhắc rằng mật khẩu tạm chưa cho phép vào nghiệp vụ.

## Khôi phục đơn vị và mở khóa tài khoản là hai thao tác riêng

Trong Cây tổ chức, **Ngừng hoạt động / Ẩn khỏi cây** giữ nguyên bản ghi và quan hệ. **Đơn vị ngừng hoạt động / Lưu trữ cũ** liệt kê các đơn vị bị ngừng/ẩn theo luồng cũ; ADMIN hoặc CDCS chọn **Khôi phục đơn vị** sau khi kiểm tra cha và xác nhận. Không tạo lại đơn vị để thay cho khôi phục.

Trong Tài khoản, **Mở khóa** chỉ mở cờ tài khoản; với tài khoản tổ chức soft-delete cũ, thao tác này phục hồi bản ghi tài khoản theo ID cũ. Đơn vị vẫn ngừng nếu chưa được khôi phục riêng, tài khoản tiếp tục bị chặn đăng nhập/nghiệp vụ. Ngược lại, khôi phục đơn vị không mở khóa bất kỳ tài khoản nào. Các tài khoản ADMIN vẫn chịu quy trình vòng đời quản trị riêng, không dùng toggle để tự khôi phục.
