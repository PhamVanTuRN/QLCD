using System;
using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class DanhMucDungChung : BaseEntity
{
    public required string Loai { get; set; } // e.g., "NgoaiNgu", "TrinhDoNgoaiNgu", "DanToc", "TonGiao", "KhocChuyenMon"
    public required string Ma { get; set; }   // e.g., "ENG", "IELTS_6.5", "KINH", "PHAT_GIAO"
    public required string Ten { get; set; }  // e.g., "Tiếng Anh", "IELTS 6.5", "Kinh", "Phật giáo"
    public int ThuTu { get; set; } = 0;
    public bool TrangThai { get; set; } = true;
    public string? GhiChu { get; set; }
}
