# ATTENDANCE CALCULATION RULES

Tài liệu trọng tâm mô tả cách hệ thống tính toán kết quả điểm danh.

## 1. Flow tính toán

```text
RAW DATA (AttendanceLog)
      ↓
VALIDATION (Loại bỏ log rác, debounce duplicate)
      ↓
WINDOW MATCHING (Lọc log theo khung giờ sự kiện)
      ↓
RULE EVALUATION (Kiểm tra số lần quét tối thiểu, thời gian lưu trú)
      ↓
AttendanceResult (Tính toán ra trạng thái)
```

## 2. Các tham số đầu vào
Một sự kiện có thể có:
1. `AttendanceRules`:
   - `MinimumRequiredCheckpoints`: Số lần điểm danh hợp lệ tối thiểu. (Mặc định: 1)
   - `MinimumDurationMinutes`: Thời gian giữa First log và Last log tối thiểu. (Mặc định: 0)
2. `AttendanceWindows`:
   - Danh sách các khung giờ (StartTime, EndTime). Có thể đánh dấu `Required` = true/false.

## 3. Ví dụ Kịch bản Tính Toán

**Kịch bản 1: Single Check (Chỉ cần có mặt là được tính)**
- Rule: `MinimumRequiredCheckpoints` = 1, `MinimumDurationMinutes` = 0.
- Window: (Trống, hoặc 1 window tùy chọn từ 07:00-11:00, Required = false).
- Tính toán:
  - Chỉ cần có >= 1 Log hợp lệ -> `PRESENT`.
  - Không có Log nào -> `ABSENT`.

**Kịch bản 2: Required 2 Windows (Điểm danh sáng và chiều)**
- Windows:
  - Sáng (07:00 - 11:30) - `Required` = true, `MinimumCount` = 1.
  - Chiều (13:00 - 17:00) - `Required` = true, `MinimumCount` = 1.
- Rule: `MinimumRequiredCheckpoints` = 2.
- Tính toán:
  - Đạt 2/2 Window -> `PRESENT`.
  - Đạt 1/2 Window -> `INCOMPLETE` (Có đến, nhưng bỏ về sớm hoặc đến muộn 1 buổi).
  - Đạt 0/2 Window -> `ABSENT`.

**Kịch bản 3: Minimum Duration (Thời lượng tối thiểu)**
- Rule: `MinimumRequiredCheckpoints` = 2, `MinimumDurationMinutes` = 60.
- Tính toán:
  - Nếu user check-in lúc 08:00, check-out lúc 08:30 (Duration = 30p).
  - Kết quả -> `INCOMPLETE` (Lý do: Duration 30m < required 60m).

## 4. Kiến trúc mở rộng
Dịch vụ `IAttendanceCalculationService` phải được thiết kế để dễ dàng cắm (plug-in) các Rule Validator mới trong tương lai.
