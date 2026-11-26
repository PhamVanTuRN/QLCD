# Phát triển QLCD

QLCD là hệ thống quản lý công đoàn cho Bệnh viện Trung ương Quân đội 108. Frontend Next.js App Router nằm ở `frontend/qlcd-web`. Backend ASP.NET Core nằm ở `backend` và chia thành Api, Application, Domain, Infrastructure, Shared cùng QLCD.Tests. SQL Server là provider môi trường triển khai. [Tổng quan hiện hành](docs/PROJECT_OVERVIEW.md)

## Thay đổi source code

- Kiểm tra Git và giữ thay đổi đang có. Đọc hướng dẫn con của frontend, sau đó đối chiếu tài liệu Next.js trong dependency đã cài trước khi thay đổi router, layout hoặc proxy.
- Đặt hợp đồng route ở controller, nghiệp vụ và kiểm quyền đối tượng ở handler, schema ở Infrastructure. Dùng DTO hiện có, truyền cancellation token và giữ tương thích API v1. Với thay đổi dữ liệu có nhiều bước, dùng cùng transaction và kiểm tra tính đúng đắn khi thất bại hoặc cập nhật đồng thời.
- Dùng `src/lib/api.ts` cho đường API và CSRF. Truy vấn màn hình có thể dùng `useResource` để hủy request cũ. Giữ trạng thái tải, rỗng, lỗi, và lỗi quyền rõ ràng. Dùng native dialog cho biểu mẫu, label cho trường nhập và giữ focus hiển thị. [Thiết kế giao diện](docs/DESIGN_SYSTEM.md)
- Phân biệt quyền theo chức năng với phạm vi tổ chức. Kiểm tra cả hai ở backend. Giữ tệp minh chứng và dữ liệu cá nhân trong môi trường được phép. Chỉ dùng tài khoản, PDF và hồ sơ tổng hợp khi kiểm thử local. [Kiểm soát bảo mật](docs/security-audit/08-remediation-status.md)
- Khi thêm migration, chạy kiểm tra model và thử từ schema trống cùng schema có dữ liệu cũ tổng hợp. Nêu dữ liệu bị tác động và cách phục hồi. Yêu cầu xác nhận trước khi tác động môi trường triển khai hay dữ liệu thực.

## Kiểm thử và hoàn thành

- Xác thực hai bước bắt buộc cho mọi vai trò. Xác minh danh tính qua kênh tin cậy trước khi cấp mã kích hoạt Authenticator. Chặn API nghiệp vụ trong phiên giới hạn. Mật khẩu mới có 8–128 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt. Mật khẩu khởi tạo `123456aA@` phải đổi và bị từ chối khi chọn mật khẩu mới. Giữ bộ băm hiện hành.
- Chỉ cấp quyền đặt lại thông tin xác thực cho ID cấu hình của `qlcd_admin` tại backend. Tách đặt lại mật khẩu và đặt lại 2FA, chặn tự đặt lại qua giao diện và API quản trị. Cả hai thao tác yêu cầu xác nhận, mật khẩu và OTP mới của người thực hiện, thu hồi phiên đích và ghi audit. Khôi phục bằng mã chỉ thay Authenticator và yêu cầu đăng nhập lại. [Kiến trúc xác thực](docs/AUTHENTICATION.md) · [Khôi phục tài khoản](docs/ACCOUNT_RECOVERY.md)

- Chạy test liên quan trong lúc sửa. Trước khi giao, chạy backend build và test, HTTP smoke, frontend lint và type check cùng production build. Chạy browser smoke nếu thao tác hoặc giao diện thay đổi.
- Đối chiếu hợp đồng UI → API → handler → SQL. Kiểm tra vai trò, biên dữ liệu, tải lỗi và phân trang khi chúng bị ảnh hưởng. Cập nhật [TASK_TRACKER](docs/TASK_TRACKER.md) bằng kết quả đã quan sát.
- Ghi lệnh, kết quả, quyết định và giới hạn trong báo cáo. Các thay đổi migration, quyền và cấu hình cần cập nhật hướng dẫn vận hành liên quan.

## Kỹ năng theo nhiệm vụ

- Rà soát nhiều module và chốt ưu tiên với [qlcd-project-audit](.agents/skills/qlcd-project-audit/SKILL.md).
- Sửa route, form và API client với [qlcd-frontend](.agents/skills/qlcd-frontend/SKILL.md).
- Sửa nghiệp vụ và hợp đồng API với [qlcd-backend](.agents/skills/qlcd-backend/SKILL.md).
- Cải thiện bố cục và khả năng truy cập với [qlcd-ui-ux](.agents/skills/qlcd-ui-ux/SKILL.md).
- Kiểm tra quyền, phiên và minh chứng với [qlcd-security-review](.agents/skills/qlcd-security-review/SKILL.md).
- Đổi truy vấn, index hoặc migration với [qlcd-sql](.agents/skills/qlcd-sql/SKILL.md).
- Cập nhật hoặc chạy kiểm thử với [qlcd-testing](.agents/skills/qlcd-testing/SKILL.md).
- Đánh giá diff và kiểm tra tương thích với [qlcd-code-review](.agents/skills/qlcd-code-review/SKILL.md).

## Chính sách tài khoản và tên đơn vị

Mật khẩu khởi tạo chuẩn là `PasswordHasher.InitialPassword` (`123456aA@`). Reset mật khẩu cho mọi vai trò đích dùng cùng giá trị, bắt buộc đổi trong 24 giờ, giữ MFA/mã khôi phục và trạng thái khóa; reset 2FA giữ nguyên mật khẩu/cờ/hạn đổi mật khẩu. Giao diện quản trị lấy giá trị/thời hạn từ `credentialPolicy` trong GET accounts. Tạo đơn vị giữ nguyên tên nhập; tên đăng nhập tự sinh không được thêm tiền tố theo vai trò hoặc cắt từ chỉ loại đơn vị mà người dùng đã nhập. Không đổi đơn vị hay tài khoản cũ khi áp dụng quy tắc tạo mới.

## Vòng đời đơn vị và tài khoản

Không xóa/soft-delete đơn vị và tài khoản khi gỡ khỏi cây. Dùng OrganizationLifecycle: TrangThai=0 cho đơn vị, cờ khóa tài khoản giữ riêng, truy cập hiệu lực bị chặn bởi đơn vị/tổ tiên ngừng. Từ chối CĐCS hoặc đơn vị có bất kỳ con nào kể cả con ngừng/soft-delete; không cascade trạng thái. Khôi phục đơn vị dùng endpoint riêng, giữ ID/FK, không mở khóa tài khoản. Không dùng Update metadata để thay trạng thái. Legacy IsDeleted chỉ đọc trong quản trị để khôi phục tường minh, không tự backfill dữ liệu. Thu hồi phiên bằng SecurityVersion trong cùng transaction; kiểm tra trạng thái tổ tiên ở login, session và scope.
