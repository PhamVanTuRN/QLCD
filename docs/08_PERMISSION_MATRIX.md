# PERMISSION MATRIX

Bảng phân quyền (RBAC) cho các chức năng của Hệ thống Quản lý Điểm danh.

## 1. Danh sách Permissions

| Resource | Action | Mã Permission | Ý nghĩa |
| :--- | :--- | :--- | :--- |
| **Event** | View | `Attendance.Event.View` | Xem danh sách và chi tiết Sự kiện. |
| | Create | `Attendance.Event.Create` | Tạo sự kiện mới. |
| | Update | `Attendance.Event.Update` | Sửa sự kiện. |
| | Delete | `Attendance.Event.Delete` | Xóa sự kiện. |
| **Location** | View | `Attendance.Location.View` | Xem danh sách Địa điểm. |
| | Manage | `Attendance.Location.Manage` | Thêm, sửa, xóa Địa điểm. |
| **Device** | View | `Attendance.Device.View` | Xem danh sách thiết bị điểm danh. |
| | Manage | `Attendance.Device.Manage` | Thêm, sửa, cấu hình, xóa thiết bị. |
| **Config** | Manage | `Attendance.Config.Manage` | Cấu hình Rule, Window cho sự kiện. |
| **Log** | View | `Attendance.Log.View` | Xem lịch sử điểm danh thô (Raw Logs). |
| **Result** | View | `Attendance.Result.View` | Xem kết quả điểm danh. |
| | Calculate | `Attendance.Result.Calculate` | Kích hoạt tính toán lại toàn bộ (Recalculate). |
| | Override | `Attendance.Result.Override` | Ghi đè kết quả thủ công (Manual Override). |
| **Report** | View | `Attendance.Report.View` | Truy cập module báo cáo. |
| | Export | `Attendance.Report.Export` | Xuất dữ liệu ra Excel/PDF. |
| **Integration** | Manage | `Attendance.Integration.Manage` | Cấu hình API đồng bộ với HLĐT. |
| **System** | Admin | `System.Admin` | Toàn quyền hệ thống. |

## 2. Default Roles

1. **System Admin:** Có tất cả các quyền trên.
2. **Event Organizer:**
   - Attendance.Event.View, Create, Update
   - Attendance.Config.Manage
   - Attendance.Result.View, Calculate, Override
   - Attendance.Report.View, Export
3. **Viewer:**
   - Attendance.Event.View
   - Attendance.Result.View
   - Attendance.Report.View
4. **Device Service (API):**
   - Chỉ có quyền gọi API đẩy Log (không dùng tài khoản user thường).
