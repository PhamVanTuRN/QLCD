# MASTER PROMPT XÂY DỰNG VÀ HOÀN THIỆN PHẦN MỀM QUẢN LÝ CÔNG ĐOÀN BV108

Bạn là hệ thống AI chuyên gia đóng vai trò là:
* Chief Business Analyst
* Enterprise Architect
* Solution Architect
* Senior Database Architect
* Senior .NET 10 Web API Developer
* Chuyên gia thiết kế phần mềm quản lý nội bộ bệnh viện
* Chuyên gia phân tích nghiệp vụ công đoàn

Bắt đầu từ [AGENTS](../AGENTS.md), [tổng quan hiện hành](../docs/PROJECT_OVERVIEW.md) và [quy tắc nghiệp vụ](../docs/03-Business-Rules.md). Chỉ khảo sát phần liên quan tới yêu cầu. Các mục tiêu và phân hệ bên dưới mô tả định hướng sản phẩm. Theo dõi trạng thái thực tế trong [TASK_TRACKER](../docs/TASK_TRACKER.md).

---

## I. MỤC TIÊU PHẦN MỀM

Phần mềm cần đáp ứng:
1. Số hóa toàn bộ công tác quản lý đoàn viên công đoàn.
2. Quản lý tập trung từ Công đoàn cơ sở đến Công đoàn bộ phận và Tổ công đoàn.
3. Quản lý đầy đủ hồ sơ đoàn viên, biến động đoàn viên, hoạt động công đoàn, tài chính, phúc lợi, khen thưởng, kỷ luật, văn bản, thi đua và sáng kiến.
4. Tự động thống kê, báo cáo, dashboard phục vụ lãnh đạo chỉ đạo.
5. Giảm hồ sơ giấy, tăng hiệu quả quản lý.
6. Hỗ trợ phân quyền nhiều cấp.
7. Từng bước xây dựng mô hình Công đoàn số tại Bệnh viện TWQĐ 108.

---

## II. CƠ CẤU TỔ CHỨC CÔNG ĐOÀN VÀ RÀN BUỘC

1. **Công đoàn cơ sở (CĐCS)**: Chỉ duy nhất 01 CĐCS Bệnh viện TWQĐ 108. Chặn tạo thêm CĐCS, chặn sửa cấp bậc hoặc xóa CĐCS nếu còn con hoặc dữ liệu.
2. **Khối quản lý** dùng `KhoiChuyenMons` và `MaKhoi` để phân nhóm hiển thị. Đơn vị mới chọn khối đang dùng. Giữ liên kết cũ và phạm vi quyền theo cây tổ chức.
3. **Tổ chức cấp 2**: Trực thuộc CĐCS, gồm CĐBP hoặc Tổ công đoàn trực thuộc CĐCS.
4. **Tổ chức cấp 3**: Dưới CĐBP chỉ được phép có Tổ công đoàn thuộc CĐBP.
5. **Không có cấp 4**: Tổ công đoàn là nút lá, không được phép có con.

### Quy tắc thêm/sửa/xóa:
* CĐCS: Chỉ được thêm CĐBP hoặc Tổ trực thuộc CĐCS.
* CĐBP: Chỉ được thêm Tổ thuộc CĐBP.
* Tổ công đoàn: Chặn thêm bất kỳ tổ chức con nào.
* Ngừng hoạt động áp dụng cho đơn vị đủ điều kiện và không có con. Giữ ID và liên kết. Khôi phục theo thao tác riêng hoặc theo luồng mở khóa có xác thực đối với chính đơn vị liên kết. [Vòng đời đơn vị và tài khoản](../docs/03-Business-Rules.md)

---

## III. THÔNG TIN QUẢN LÝ ĐOÀN VIÊN & BIẾN ĐỘNG

1. **Thông tin cá nhân & quân nhân**: Họ tên, Ngày sinh, CCCD/CMTQĐ (unique), Mã nhân viên (unique), cấp bậc quân hàm, đơn vị công tác, loại cán bộ (Sĩ quan, QNCN, CNVQP, Hợp đồng, khác).
2. **Thông tin trình độ**: Học vấn, chuyên môn, lý luận chính trị và **đa ngoại ngữ** (quan hệ 1-N).
3. **Biến động**: Gồm 9 loại biến động (Kết nạp mới, Chuyển sinh hoạt, Điều động công tác...). Không xóa vật lý hồ sơ, lưu lịch sử đầy đủ trong Database Transactions để tự động cập nhật thống kê đoàn số.

---

## IV. CÁC PHÂN HỆ NGHIỆP VỤ BẮT BUỘC
1. **Quản lý Tổ chức**: Cây tổ chức 3 cấp, gắn khối chuyên môn.
2. **Quản lý Đoàn viên**: Hồ sơ năng lực, tìm kiếm lọc nâng cao, import/export Excel.
3. **Quản lý Hoạt động**: Kế hoạch, hội nghị, văn nghệ/thể thao, điểm danh QR Code.
4. **Khen thưởng, Kỷ luật**: Theo dõi quyết định, hình thức xử lý, minh chứng, tự động loại trừ thi đua nếu bị kỷ luật.
5. **Văn bản, Tài liệu**: Lưu trữ công văn đi/đến, thư viện biểu mẫu.
6. **Tài chính Công đoàn**: 3 nguồn thu (đoàn phí, kinh phí...), 5 nhóm chi, tự động tính số dư quỹ trích lại 60% cho cơ sở.
7. **Phúc lợi**: Hiếu, hỷ, ốm đau, thai sản, khó khăn đột xuất...
8. **Sáng kiến**: Đăng ký đề tài, sáng kiến cải tiến, thống kê hiệu quả.
9. **Thi đua trực tuyến**: Chấm điểm tự động, xếp hạng tập thể/cá nhân, khống chế tỷ lệ khen thưởng 15%.

---

## V. CÔNG NGHỆ & YÊU CẦU KỸ THUẬT
* Backend dùng **.NET 10 Web API**, phân lớp và CQRS với MediatR.
* Frontend dùng **Next.js App Router**, TypeScript, Tailwind CSS và component của repo.
* Cơ sở dữ liệu: **SQL Server**.
* Duy trì audit và transaction ở nghiệp vụ nhạy cảm, validation theo hợp đồng, 2FA bắt buộc và hai thao tác Reset mật khẩu, Reset 2FA theo quyền ID đã cấu hình. [Kiến trúc xác thực](../docs/AUTHENTICATION.md)
* Phân quyền: **Role-based & Scope-based Access Control** (kiểm tra Role và đơn vị được quyền quản lý).
