# EVENT BUSINESS RULE TRACEABILITY

| Business Rule | Requirement | Use Case | API | Frontend Screen | Test Case |
|---|---|---|---|---|---|
| BR-001 (Nhiều địa điểm) | Sự kiện có thể diễn ra ở nhiều địa điểm | UC-CreateEvent | POST /api/events | Wizard: Địa điểm & Thiết bị | EVT-TC-004 |
| BR-003 (Nhiều thiết bị) | Một hội trường có thể gắn nhiều thiết bị | UC-CreateEvent | POST /api/events | Wizard: Địa điểm & Thiết bị | EVT-TC-005 |
| BR-006 (Khung giờ) | Hỗ trợ nhiều khung giờ (Session) và Rule | UC-CreateEvent | POST /api/events | Wizard: Phiên & Quy tắc | EVT-TC-003, EVT-TC-007 |
