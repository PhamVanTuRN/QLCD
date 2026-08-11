using System;
using AttendanceManagement.Domain.Common;

namespace AttendanceManagement.Domain.Entities;

public class DanhMucDungChung : BaseEntity
{
    public required string Loai { get; set; } // e.g., "NgoaiNgu", "TrinhDoNgoaiNgu", "DanToc", "TonGiao", "KhocChuyenMon"
    public required string Ma { get; set; }   // e.g., "ENG", "IELTS_6.5", "KINH", "PHAT_GIAO"
    public required string Ten { get; set; }  // e.g., "Tiáº¿ng Anh", "IELTS 6.5", "Kinh", "Pháº­t giÃ¡o"
    public int ThuTu { get; set; } = 0;
    public bool TrangThai { get; set; } = true;
    public string? GhiChu { get; set; }
}
