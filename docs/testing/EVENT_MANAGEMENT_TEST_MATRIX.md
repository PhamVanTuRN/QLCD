# EVENT MANAGEMENT TEST MATRIX

| Test ID | Business Rule | Scenario | Preconditions | Input | Expected Result | Actual Result | Status | Bug/Fix Reference |
|---|---|---|---|---|---|---|---|---|
| EVT-TC-001 | Create Basic | Tạo Event cơ bản thành công | User có quyền tạo | Valid data | Trạng thái DRAFT, EventCode được tạo | | PENDING | |
| EVT-TC-002 | Unique Code | Prevent duplicate EventCode | Event đã tồn tại | EventCode trùng | REJECT, validation error | | PENDING | |
| EVT-TC-003 | Session Validate | StartTime < EndTime | Tạo 1 session | Start 11:30, End 07:30 | REJECT | | PENDING | |
| EVT-TC-004 | Multi-Location | Event nhiều hội trường | Data có 3 location | Chọn HT-A, HT-B, HT-C | Lưu đủ 3 EventLocation | | PENDING | |
| EVT-TC-005 | Location-Device | Thiết bị thuộc đúng Location | HT-A có 3 Cam | Chọn CAM-A01, CAM-B01 cho HT-A | REJECT nếu CAM-B01 không thuộc HT-A | | PENDING | |
| EVT-TC-006 | Participant | ALL_HOSPITAL mode | Create Event | Mode: ALL_HOSPITAL | Không bắt buộc EventParticipant, lưu mode đúng | | PENDING | |
| EVT-TC-007 | Attendance Rule | Check-in rule validity | Start, Ref, End | 09:00, 08:00, 08:30 | REJECT, WindowStart <= Ref <= WindowEnd | | PENDING | |
| EVT-TC-008 | Conflict Device | Prevent overlap Device | Event A dùng Cam1 | Event B dùng Cam1 cùng giờ | Cảnh báo / Reject theo policy | | PENDING | |
| EVT-TC-009 | Reload Save | Persistence verify | Tạo Event, lưu | Reload app | Giữ nguyên dữ liệu cấu hình | | PENDING | |
