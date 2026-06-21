using QLCD.Domain.Common;

namespace QLCD.Domain.Entities;

public class KhoiChuyenMon : BaseEntity
{
    public required string TenKhoi { get; set; } // Khối Cơ quan, Khối Nội, Khối Ngoại, Khối Cận lâm sàng
}
