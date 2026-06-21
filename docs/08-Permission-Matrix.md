# 08. PERMISSION MATRIX - MA TRẬN PHÂN QUYỀN HỆ THỐNG

Tài liệu này xác định ma trận vai trò người dùng (RBAC) kết hợp với ràng buộc phạm vi dữ liệu (Scope) trên hệ thống QLCD.

## 1. Định nghĩa vai trò (Roles)
1. **SYS_ADMIN (Quản trị hệ thống)**: Toàn quyền cấu hình hệ thống, quản lý tài khoản.
2. **CHUTICH_CDCS (Chủ tịch CĐCS)**: Xem và phê duyệt toàn bộ dữ liệu công đoàn toàn bệnh viện.
3. **PHOCHUTICH_CDCS (Phó Chủ tịch CĐCS)**: Quyền xem toàn viện, phê duyệt các nghiệp vụ được phân công.
4. **UYVIEN_BCH_CDCS (Ủy viên BCH CĐCS)**: Thực hiện các tác vụ nghiệp vụ chuyên trách (tài chính, thi đua) toàn viện.
5. **CHUTICH_CDBP (Chủ tịch CĐBP)**: Quản lý dữ liệu và phê duyệt sơ bộ các đề xuất của các Tổ công đoàn trực thuộc CĐBP của mình.
6. **TOTRUONG_CD (Tổ trưởng Công đoàn)**: Quản lý trực tiếp đoàn viên thuộc Tổ công đoàn mình quản lý. Nhập dữ liệu đóng đoàn phí của tổ.
7. **DOANVIEN (Đoàn viên)**: Xem hồ sơ cá nhân, đăng ký hoạt động, đề xuất xin trợ cấp cá nhân.

## 2. Ma trận Phân quyền và Phạm vi Dữ liệu (Permissions & Data Scopes)

| Module / Chức năng | SYS_ADMIN | CHUTICH_CDCS | CHUTICH_CDBP | TOTRUONG_CD | DOANVIEN |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Quản trị hệ thống** | **ALL** | Read | None | None | None |
| **Quản lý Cây Tổ chức** | **ALL** | **ALL** | Read (CĐBP mình) | Read (Tổ mình) | None |
| **Thêm/Sửa Đoàn viên** | **ALL** | **ALL** | Create/Update (CĐBP) | Create/Update (Tổ) | None |
| **Chuyển sinh hoạt Đoàn viên**| **ALL** | **ALL (Toàn viện)**| Duyệt (Trong CĐBP) | Đề xuất | None |
| **Quản lý Tài chính (Thu/Chi)**| None | **ALL** | **ALL (CĐBP mình)** | Cập nhật đóng phí tổ | None |
| **Phê duyệt Phúc lợi** | None | **Duyệt chi** | Duyệt sơ bộ | Đề xuất (Cho tổ) | Đề xuất (Cá nhân) |
| **Đăng ký Sáng kiến** | None | Duyệt / Đánh giá | Đề xuất (CĐBP) | Đề xuất (Tổ) | Đăng ký (Cá nhân) |
| **Chấm điểm Thi đua** | None | **Duyệt cuối** | Chấm điểm CĐBP | Chấm điểm Tổ | Tự chấm điểm |

---

## 3. Cơ chế kiểm soát Phạm vi Dữ liệu trên API (Backend Scope Filtering)
Mọi API Endpoint nghiệp vụ bắt buộc phải kiểm tra thông tin User Claims từ JWT:
* User thuộc đơn vị công đoàn nào (`UnionUnitId`) và cấp bậc vai trò là gì.
* Khi thực hiện truy vấn hoặc sửa đổi dữ liệu (ví dụ lấy danh sách đoàn viên hoặc cập nhật đoàn phí), Backend tự động chèn thêm điều kiện lọc:
  * Nếu là `TOTRUONG_CD`: Chỉ truy vấn dữ liệu đoàn viên có `MaToCongDoan = User.UnionUnitId`.
  * Nếu là `CHUTICH_CDBP`: Chỉ truy vấn dữ liệu đoàn viên thuộc các Tổ công đoàn có `MaParent = User.UnionUnitId`.
  * Nếu là Cấp CĐCS (`CHUTICH_CDCS`, `UYVIEN_BCH_CDCS`): Được phép truy cập dữ liệu của toàn viện.
* Nếu cố tình thay đổi tham số trên URL để truy cập đơn vị khác, API sẽ trả về lỗi `403 Forbidden`.
