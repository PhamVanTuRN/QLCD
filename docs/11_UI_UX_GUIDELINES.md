# UI/UX GUIDELINES

Tài liệu hướng dẫn thiết kế giao diện cho phần mềm Quản lý điểm danh (Dựa trên Next.js và TailwindCSS).

## 1. Cấu trúc Menu (Sidebar)
Menu bên trái cần được tổ chức theo nhóm nghiệp vụ:

**1. Tổng quan**
- Dashboard chung

**2. Quản lý sự kiện**
- Danh sách sự kiện
- Tạo/Sửa sự kiện

**3. Quản lý địa điểm**
- Danh sách hội trường / Location
- Quản lý Camera / Thiết bị (Device)

**4. Quản lý điểm danh**
- Log điểm danh (Raw Logs - Chỉ xem)
- Kết quả điểm danh (View + Override)
- Danh sách tham dự (Participant List)

**5. Cấu hình**
- Attendance Rules & Windows

**6. Báo cáo**
- Báo cáo tổng hợp
- Export dữ liệu

**7. Tích hợp & Hệ thống**
- Đồng bộ HLĐT
- Users & Roles

## 2. Style Guide
Hệ thống giữ nguyên Design System hiện có (nếu có từ dự án cũ), với các tông màu cơ bản:
- Primary Color: Xanh Blue (Tạo cảm giác y tế, tin cậy).
- Danger Color: Đỏ (Cho các hành động Xóa, hoặc trạng thái ABSENT, INVALID).
- Success Color: Xanh lá (Cho trạng thái PRESENT).
- Warning Color: Vàng/Cam (Cho trạng thái INCOMPLETE, LATE).

## 3. Quy tắc UX
- **Không bao giờ cho phép xóa Raw Logs trên UI:** Log điểm danh chỉ có màn hình View, không có nút Delete hay Edit.
- **Xác nhận (Confirm) khi ghi đè:** Khi user thực hiện Manual Override, UI phải hiển thị Dialog yêu cầu nhập lý do bắt buộc.
- **Tính toán nặng (Recalculate):** Nút Recalculate phải có cảnh báo tiến trình có thể mất thời gian, hiển thị loading spinner không chặn toàn màn hình.
