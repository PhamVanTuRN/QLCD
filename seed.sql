USE qldd;

DECLARE @DeptNoiId UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptNgoaiId UNIQUEIDENTIFIER = NEWID();
DECLARE @DeptCnttId UNIQUEIDENTIFIER = NEWID();

INSERT INTO Departments (Id, Code, Name, Status, IsDeleted, CreatedDate) VALUES 
(@DeptNoiId, 'DEPT_NOI', N'Khoa Nội', 1, 0, GETDATE()),
(@DeptNgoaiId, 'DEPT_NGOAI', N'Khoa Ngoại', 1, 0, GETDATE()),
(@DeptCnttId, 'DEPT_CNTT', N'Ban CNTT', 1, 0, GETDATE());

DECLARE @LocAId UNIQUEIDENTIFIER = NEWID();
DECLARE @LocBId UNIQUEIDENTIFIER = NEWID();
DECLARE @LocCId UNIQUEIDENTIFIER = NEWID();

INSERT INTO Locations (Id, Code, Name, Capacity, IsActive, IsDeleted, CreatedDate) VALUES 
(@LocAId, 'HT-A', N'Hội trường A', 500, 1, 0, GETDATE()),
(@LocBId, 'HT-B', N'Hội trường B', 200, 1, 0, GETDATE()),
(@LocCId, 'HT-C', N'Hội trường C', 100, 1, 0, GETDATE());

INSERT INTO AttendanceDevices (Id, DeviceCode, DeviceName, LocationId, DeviceType, IsActive, IsDeleted, CreatedDate) VALUES 
(NEWID(), 'CAM-A01', 'Camera A01', @LocAId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-A02', 'Camera A02', @LocAId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-A03', 'Camera A03', @LocAId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-B01', 'Camera B01', @LocBId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-B02', 'Camera B02', @LocBId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-C01', 'Camera C01', @LocCId, 'CAMERA', 1, 0, GETDATE()),
(NEWID(), 'CAM-C02', 'Camera C02', @LocCId, 'CAMERA', 1, 0, GETDATE());

INSERT INTO Persons (Id, Code, FullName, DepartmentId, CCCD, Status, IsDeleted, CreatedDate) VALUES 
(NEWID(), 'P001', N'Nguyễn Văn A', @DeptNoiId, '001090111111', 1, 0, GETDATE()),
(NEWID(), 'P002', N'Trần Thị B', @DeptNoiId, '001090111112', 1, 0, GETDATE()),
(NEWID(), 'P003', N'Lê Văn C', @DeptNoiId, '001090111113', 1, 0, GETDATE()),
(NEWID(), 'P004', N'Phạm Thị D', @DeptNgoaiId, '001090111114', 1, 0, GETDATE()),
(NEWID(), 'P005', N'Hoàng Văn E', @DeptNgoaiId, '001090111115', 1, 0, GETDATE()),
(NEWID(), 'P006', N'Đỗ Thị F', @DeptNgoaiId, '001090111116', 1, 0, GETDATE()),
(NEWID(), 'P007', N'Vũ Văn G', @DeptCnttId, '001090111117', 1, 0, GETDATE()),
(NEWID(), 'P008', N'Ngô Thị H', @DeptCnttId, '001090111118', 1, 0, GETDATE()),
(NEWID(), 'P009', N'Đặng Văn I', @DeptCnttId, '001090111119', 1, 0, GETDATE()),
(NEWID(), 'P010', N'Bùi Thị K', @DeptCnttId, '001090111120', 1, 0, GETDATE());
