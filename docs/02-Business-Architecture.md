# 02. BUSINESS ARCHITECTURE - KIẾN TRÚC NGHIỆP VỤ

## 1. Phân cấp Cấu trúc Tổ chức (3 Cấp nghiêm ngặt)
Mô hình tổ chức công đoàn trong hệ thống được giới hạn nghiêm ngặt ở 3 cấp bậc:
1. **Cấp 1 (CĐCS)**: Công đoàn cơ sở Bệnh viện TWQĐ 108.
2. **Cấp 2 (CĐBP hoặc Tổ trực thuộc CĐCS)**: Các công đoàn bộ phận thuộc khoa/phòng hoặc các Tổ công đoàn lớn sinh hoạt trực tiếp dưới sự chỉ đạo của CĐCS.
3. **Cấp 3 (Tổ thuộc CĐBP)**: Các tổ công đoàn trực thuộc CĐBP.

```
                  ┌──────────────────────────────────────────────┐
                  │          CĐCS (Công đoàn Cơ sở)              │  Level 1
                  └──────────────┬──────────────┬────────────────┘
                                 │              │
        (Trực thuộc)             ▼              ▼   (Dưới CĐCS)
    ┌───────────────────────────────┐        ┌───────────────────────────────┐
    │     Tổ công đoàn trực thuộc   │        │     Công đoàn bộ phận (CĐBP)  │  Level 2
    └───────────────────────────────┘        └──────────────┬────────────────┘
                                                            │
                                                            ▼   (Dưới CĐBP)
                                             ┌───────────────────────────────┐
                                             │      Tổ công đoàn thuộc CĐBP  │  Level 3
                                             └───────────────────────────────┘
```

## 2. Bản đồ Nghiệp vụ & Vòng đời Đoàn viên
Vòng đời đoàn viên được số hóa qua các trạng thái:
* **Kết nạp mới**: Thêm vào Tổ công đoàn -> duyệt bởi CĐBP -> CĐCS ký phê duyệt chính thức cấp thẻ.
* **Chuyển sinh hoạt**: Thay đổi vị trí sinh hoạt công đoàn (giữa các Tổ cùng CĐBP, hoặc khác CĐBP, hoặc chuyển ra khỏi Bệnh viện).
* **Hoạt động & Tài chính**: Tham gia sinh hoạt định kỳ, check-in QR Code, đóng đoàn phí (tự động trích lương hoặc đóng tiền mặt).
* **Thi đua & Chăm lo**: Chấm điểm thi đua, đề xuất khen thưởng/kỷ luật, nhận quà tặng phúc lợi, ghi nhận sáng kiến.
* **Kết thúc sinh hoạt**: Nghỉ hưu, thôi việc hoặc ra khỏi tổ chức công đoàn.
