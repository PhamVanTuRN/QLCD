using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using QLCD.Domain.Entities;

namespace QLCD.Application.Common.Interfaces;

public interface IQLCDDbContext
{
    DbSet<DonViCongDoan> DonViCongDoans { get; }
    DbSet<DoanVien> DoanViens { get; }
    DbSet<DoanVienNgoaiNgu> DoanVienNgoaiNgus { get; }
    DbSet<KhoiChuyenMon> KhoiChuyenMons { get; }
    DbSet<LichSuBienDong> LichSuBienDongs { get; }
    DbSet<AuditLog> AuditLogs { get; }
    
    // Mới bổ sung
    DbSet<DanhMucDungChung> DanhMucDungChungs { get; }
    DbSet<TaiKhoan> TaiKhoans { get; }
    DbSet<HoatDongCongDoan> HoatDongCongDoans { get; }
    DbSet<TaiChinhCongDoan> TaiChinhCongDoans { get; }
    DbSet<PhucLoiDoanVien> PhucLoiDoanViens { get; }
    DbSet<SangKien> SangKiens { get; }
    DbSet<ThiDuaCongDoan> ThiDuaCongDoans { get; }
    DbSet<EvidenceFile> EvidenceFiles { get; }
    
    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
