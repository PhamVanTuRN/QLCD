using System;
using System.Collections.Generic;
using QLCD.Domain.Common;
using QLCD.Domain.Enums;

namespace QLCD.Domain.Entities;

public class DonViCongDoan : BaseEntity
{
    public required string TenDonVi { get; set; }
    public LoaiToChuc LoaiToChuc { get; set; }
    public int Level { get; set; } // 1: CĐCS, 2: CDBP hoặc Tổ trực thuộc CĐCS, 3: Tổ thuộc CDBP
    public Guid? MaParent { get; set; }
    public Guid? MaKhoi { get; set; }
    public int TrangThai { get; set; } = 1; // 1: Đang hoạt động, 0: Ngừng hoạt động

    // Navigation properties
    public virtual DonViCongDoan? Parent { get; set; }
    public virtual ICollection<DonViCongDoan> Children { get; set; } = new List<DonViCongDoan>();
    public virtual KhoiChuyenMon? KhoiChuyenMon { get; set; }
    public virtual ICollection<DoanVien> DoanViens { get; set; } = new List<DoanVien>();
}
