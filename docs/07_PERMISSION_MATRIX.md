# 07. PERMISSION MATRIX - MA TRẬN PHÂN QUYỀN

Hệ thống QLCD áp dụng phân quyền dựa trên Vai trò (Role-based Access Control - RBAC) kết hợp với Phạm vi dữ liệu (Data Scope) để đảm bảo bảo mật thông tin trong môi trường quân đội.

## 1. Các Vai trò trong Hệ thống (Roles)
* **SYS_ADMIN (Quản trị hệ thống)**: Toàn quyền cấu hình hệ thống, quản lý tài khoản và phân quyền.
* **CDCS_ADMIN (BCH Công đoàn Cơ sở - Ban Tài chính/Thi đua)**: Quản lý toàn bộ dữ liệu công đoàn toàn bệnh viện, phê duyệt cuối cùng về thi đua, tài chính và nhân sự.
* **CDBP_LEADER (BCH Công đoàn Bộ phận)**: Quản lý dữ liệu của các Tổ công đoàn trực thuộc phạm vi CĐBP của mình. Duyệt sơ bộ đề xuất.
* **TOCONGDOAN_LEADER (Tổ trưởng Tổ Công đoàn)**: Quản lý dữ liệu đoàn viên thuộc tổ của mình. Nhập thông tin đóng đoàn phí, tạo đề xuất.
* **UNION_MEMBER (Đoàn viên)**: Quyền cơ bản, chỉ được xem thông tin cá nhân của mình, gửi phản hồi và gửi yêu cầu trợ cấp cá nhân.

## 2. Ma trận Chức năng & Vai trò (Feature Permission Matrix)

| Chức năng / Module | SYS_ADMIN | CDCS_ADMIN | CDBP_LEADER | TOCONGDOAN_LEADER | UNION_MEMBER |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Cấu hình Hệ thống & Phân quyền** | **ALL** | Read | None | None | None |
| **Quản lý 15 CĐBP & Tổ công đoàn** | **ALL** | **ALL** | Read (Đơn vị mình) | Read (Đơn vị mình) | None |
| **Thêm mới Đoàn viên** | **ALL** | **ALL** | Create/Update | Create/Update | None |
| **Phê duyệt Hồ sơ Đoàn viên mới** | None | **ALL** | Duyệt sơ bộ | None | None |
| **Chuyển sinh hoạt công đoàn** | **ALL** | **ALL** | Duyệt cấp bộ phận | Đề xuất | None |
| **Import Bảng lương thu đoàn phí**| None | **ALL** | None | None | None |
| **Xác nhận thu đoàn phí thủ công** | None | Read | Read (Bộ phận) | **ALL (Chỉ tổ mình)**| None |
| **Xem báo cáo tài chính cấp viện** | None | **ALL** | None | None | None |
| **Xem báo cáo tài chính cấp CĐBP** | None | Read | **ALL (Bộ phận)** | None | None |
| **Thiết lập đợt thi đua mới** | None | **ALL** | None | None | None |
| **Đề xuất thi đua cấp Tổ** | None | Read | Read (Bộ phận) | **ALL (Chỉ tổ mình)**| None |
| **Phê duyệt đề xuất thi đua** | None | **ALL** | Duyệt cấp bộ phận | None | None |
| **Đăng ký đề xuất phúc lợi/trợ cấp**| None | None | Create (Dự chi) | Create (Dự chi) | **Create (Cá nhân)**|
| **Phê duyệt chi phúc lợi/trợ cấp** | None | **ALL (Duyệt chi)**| Duyệt cấp bộ phận | None | None |

## 3. Ràng buộc Phạm vi Dữ liệu (Data Scope Constraints)
* **Quy tắc Phạm vi Dữ liệu**:
  * Tài khoản có vai trò `TOCONGDOAN_LEADER` chỉ có thể xem danh sách và thực hiện các chức năng cho những đoàn viên có `MaToCongDoan` khớp với Tổ công đoàn mà tài khoản đó quản lý.
  * Tài khoản `CDBP_LEADER` có thể xem thông tin của tất cả đoàn viên thuộc các Tổ công đoàn con trực thuộc CĐBP của mình quản lý.
  * Tài khoản `CDCS_ADMIN` có quyền xem và truy vấn dữ liệu của tất cả 2000 đoàn viên trong toàn bệnh viện.
