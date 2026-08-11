# DATABASE DESIGN

Thiết kế cơ sở dữ liệu của phần mềm Quản lý điểm danh dựa trên Entity Framework Core. Các bảng được kế thừa từ `BaseEntity` (có Id, IsDeleted, CreatedAt, UpdatedAt, v.v.).

## 1. Bảng Events
- Quản lý sự kiện.
- **PK**: `Id` (Guid)
- Có chỉ mục (Index) trên `Code`.
- Soft Delete: `IsDeleted` = true.

## 2. Bảng Locations
- Quản lý hội trường, phòng học.
- **PK**: `Id` (Guid)
- Soft Delete: `IsDeleted` = true.

## 3. Bảng EventLocations
- Bảng trung gian giải quyết quan hệ N:N giữa Event và Location.
- **PK**: (`EventId`, `LocationId`)
- **FK**: `EventId` -> `Events.Id`
- **FK**: `LocationId` -> `Locations.Id`

## 4. Bảng AttendanceDevices
- Quản lý các thiết bị điểm danh.
- **PK**: `Id` (Guid)
- **FK**: `LocationId` -> `Locations.Id`. Một địa điểm có thể có nhiều thiết bị.
- Soft Delete: `IsDeleted` = true.

## 5. Bảng AttendanceRules
- Quản lý quy tắc (thời gian tối thiểu, số lần check tối thiểu).
- **PK**: `Id` (Guid)
- **FK**: `EventId` -> `Events.Id`

## 6. Bảng AttendanceWindows
- Quản lý các khung giờ điểm danh.
- **PK**: `Id` (Guid)
- **FK**: `EventId` -> `Events.Id`

## 7. Bảng RawAttendanceLogs
- Lưu trữ lịch sử quét của thiết bị. Bảng này dữ liệu phình to nhanh.
- **PK**: `Id` (Guid)
- **FK**: `EventId` -> `Events.Id` (Có thể NULL nếu chưa xác định được Event)
- **FK**: `LocationId` -> `Locations.Id`
- **FK**: `DeviceId` -> `AttendanceDevices.Id`
- **Index**: Tối ưu hóa truy vấn trên `EventId`, `AttendanceTime`, và `CCCD`.
- **Note**: Không cho phép xóa vật lý, giữ nguyên bản ghi lỗi.

## 8. Bảng AttendanceResults
- Lưu kết quả tổng hợp sau khi tính toán.
- **PK**: `Id` (Guid)
- **FK**: `EventId` -> `Events.Id`
- **Unique Constraint**: (`EventId`, `CCCD`) - Một người chỉ có 1 kết quả duy nhất cho 1 sự kiện.
- Chứa các cờ trạng thái (`AttendanceStatus`, `IsManualOverride`).

## Sơ đồ quan hệ

```text
Events (1) -------- (N) EventLocations (N) -------- (1) Locations
                                                      |
                                                     (1)
                                                      |
                                                     (N)
                                               AttendanceDevices

Events (1) -------- (N) AttendanceRules
Events (1) -------- (N) AttendanceWindows

Events (1) -------- (N) RawAttendanceLogs (N) ----- (1) AttendanceDevices
Events (1) -------- (N) AttendanceResults
```
