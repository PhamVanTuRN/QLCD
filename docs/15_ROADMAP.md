# 15. ROADMAP - LỘ TRÌNH PHÁT TRIỂN KHUYẾN NGHỊ

Lộ trình phát triển và hoàn thiện Hệ thống QLCD Bệnh viện TWQĐ 108 được chia làm 4 giai đoạn (Phases) kế thừa chặt chẽ để đảm bảo không phá vỡ cấu trúc và dữ liệu.

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│     Phase 1      │ ───> │     Phase 2      │ ───> │     Phase 3      │ ───> │     Phase 4      │
│ Tài liệu, DB,    │      │ Hoạt động,       │      │ Tài chính,       │      │ Sáng kiến,       │
│ Auth, Tổ chức,   │      │ Khen thưởng      │      │ Phúc lợi,        │      │ Thi đua trực     │
│ Đoàn viên, Dash  │      │ Kỷ luật, Văn bản │      │ Mái ấm CĐ        │      │ tuyến, QR, Chữ ký│
└──────────────────┘      └──────────────────┘      └──────────────────┘      └──────────────────┘
```

## Phase 1: Core Foundation & Nhân sự (Trọng tâm hiện tại)
* **Tài liệu nền tảng**: Xây dựng 14 tài liệu phân tích nghiệp vụ và database design chi tiết.
* **Cơ sở dữ liệu**: Thiết lập ERD và các class C# Entity hoàn chỉnh.
* **Xác thực cơ bản (Auth)**: JWT Token Authentication cơ bản.
* **Tổ chức công đoàn**: Cây tổ chức 3 cấp nghiêm ngặt, liên kết khối chuyên môn, chặn các lỗi sai cấu trúc.
* **Đoàn viên**: Quản lý hồ sơ chi tiết (học vấn, đa ngoại ngữ), 9 loại biến động trong transaction, import/export Excel.
* **Dashboard cơ bản**: Thống kê số lượng đoàn viên tự động theo đơn vị, giới tính, quân hàm.

## Phase 2: Hoạt động & Quản lý Hành chính
* **Hoạt động công đoàn**: Kế hoạch năm/quý/tháng, hội nghị, phong trào văn thể mỹ.
* **Khen thưởng & Kỷ luật**: Ghi nhận quyết định khen thưởng thi đua, quản lý thời hạn hiệu lực kỷ luật đoàn viên.
* **Văn bản**: Quản lý lưu trữ văn bản đi/đến, thư viện biểu mẫu nội bộ.

## Phase 3: Tài chính & Chăm lo đời sống
* **Tài chính công đoàn**: Thu đoàn phí tự động qua lương hoặc thủ công, phân bổ 60% kinh phí trích lại cho cơ sở.
* **Phúc lợi đoàn viên**: Quy trình đề xuất thăm hỏi hiếu hỷ, ốm đau, thai sản kèm minh chứng trực quan.
* **Mái ấm công đoàn**: Theo dõi các quỹ hỗ trợ đặc biệt dài hạn cho đoàn viên hoàn cảnh đặc biệt khó khăn.

## Phase 4: Sáng kiến khoa học & Số hóa nâng cao
* **Sáng kiến & Đề tài**: Đăng ký, nghiệm thu đề tài khoa học y tế quân sự và sáng kiến cải tiến kỹ thuật.
* **Thi đua trực tuyến**: Chấm điểm tự động dựa trên tiêu chí và hoạt động thực tế, bảng xếp hạng các đơn vị.
* **QR Code & Chữ ký số**: Check-in sự kiện qua QR Code, ký duyệt điện tử các báo cáo tài chính/khen thưởng.
