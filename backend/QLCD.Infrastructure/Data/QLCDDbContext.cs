using System;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Common;
using QLCD.Domain.Entities;

namespace QLCD.Infrastructure.Data;

public class QLCDDbContext : DbContext, IQLCDDbContext
{
    public QLCDDbContext(DbContextOptions<QLCDDbContext> options) : base(options)
    {
    }

    public DbSet<DonViCongDoan> DonViCongDoans { get; set; } = null!;
    public DbSet<DoanVien> DoanViens { get; set; } = null!;
    public DbSet<DoanVienNgoaiNgu> DoanVienNgoaiNgus { get; set; } = null!;
    public DbSet<KhoiChuyenMon> KhoiChuyenMons { get; set; } = null!;
    public DbSet<LichSuBienDong> LichSuBienDongs { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    
    // Mới bổ sung
    public DbSet<DanhMucDungChung> DanhMucDungChungs { get; set; } = null!;
    public DbSet<TaiKhoan> TaiKhoans { get; set; } = null!;
    public DbSet<HoatDongCongDoan> HoatDongCongDoans { get; set; } = null!;
    public DbSet<TaiChinhCongDoan> TaiChinhCongDoans { get; set; } = null!;
    public DbSet<PhucLoiDoanVien> PhucLoiDoanViens { get; set; } = null!;
    public DbSet<SangKien> SangKiens { get; set; } = null!;
    public DbSet<ThiDuaCongDoan> ThiDuaCongDoans { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // 1. Cấu hình thực thể KhoiChuyenMon
        modelBuilder.Entity<KhoiChuyenMon>(entity =>
        {
            entity.HasIndex(e => e.TenKhoi).IsUnique();
            entity.Property(e => e.TenKhoi).HasMaxLength(100).IsRequired();
        });

        // 2. Cấu hình thực thể DonViCongDoan
        modelBuilder.Entity<DonViCongDoan>(entity =>
        {
            entity.Property(e => e.TenDonVi).HasMaxLength(150).IsRequired();
            
            entity.HasOne(e => e.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(e => e.MaParent)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.KhoiChuyenMon)
                .WithMany()
                .HasForeignKey(e => e.MaKhoi)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 3. Cấu hình thực thể DoanVien
        modelBuilder.Entity<DoanVien>(entity =>
        {
            entity.HasIndex(e => e.SoCCCD).IsUnique();
            entity.HasIndex(e => e.MaNhanVien).IsUnique();
            
            entity.Property(e => e.HoTen).HasMaxLength(100).IsRequired();
            entity.Property(e => e.SoCCCD).HasMaxLength(12).IsRequired();
            entity.Property(e => e.MaNhanVien).HasMaxLength(20).IsRequired();

            entity.HasOne(e => e.ToCongDoan)
                .WithMany(t => t.DoanViens)
                .HasForeignKey(e => e.MaToCongDoan)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 4. Cấu hình thực thể DoanVienNgoaiNgu
        modelBuilder.Entity<DoanVienNgoaiNgu>(entity =>
        {
            entity.Property(e => e.NgoaiNgu).HasMaxLength(100).IsRequired();
            entity.Property(e => e.TrinhDo).HasMaxLength(50).IsRequired();
            
            entity.HasOne(e => e.DoanVien)
                .WithMany(d => d.DoanVienNgoaiNgus)
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // 5. Cấu hình thực thể LichSuBienDong
        modelBuilder.Entity<LichSuBienDong>(entity =>
        {
            entity.Property(e => e.LyDo).HasMaxLength(1000).IsRequired();

            entity.HasOne(e => e.DoanVien)
                .WithMany(d => d.LichSuBienDongs)
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.TuToCongDoan)
                .WithMany()
                .HasForeignKey(e => e.TuToCongDoanId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DenToCongDoan)
                .WithMany()
                .HasForeignKey(e => e.DenToCongDoanId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 6. Cấu hình thực thể AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.EntityName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(20).IsRequired();
        });

        // 7. Cấu hình thực thể DanhMucDungChung
        modelBuilder.Entity<DanhMucDungChung>(entity =>
        {
            entity.HasIndex(e => new { e.Loai, e.Ma }).IsUnique();
            entity.Property(e => e.Loai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Ma).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Ten).HasMaxLength(250).IsRequired();
            entity.Property(e => e.GhiChu).HasMaxLength(500);
        });

        // 8. Cấu hình thực thể TaiKhoan
        modelBuilder.Entity<TaiKhoan>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(250).IsRequired();
            entity.Property(e => e.HoTen).HasMaxLength(100).IsRequired();
            entity.Property(e => e.VaiTro).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordRaw).HasMaxLength(100);

            entity.HasOne(e => e.Organization)
                .WithMany()
                .HasForeignKey(e => e.OrganizationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 9. Cấu hình thực thể HoatDongCongDoan
        modelBuilder.Entity<HoatDongCongDoan>(entity =>
        {
            entity.Property(e => e.TenHoatDong).HasMaxLength(250).IsRequired();
            entity.Property(e => e.MoTa).HasMaxLength(1000);
            entity.Property(e => e.LoaiHoatDong).HasMaxLength(50).IsRequired();
            entity.Property(e => e.DiaDiem).HasMaxLength(250).IsRequired();
            entity.Property(e => e.MaQRCode).HasMaxLength(100);
            entity.Property(e => e.KinhPhi).HasPrecision(18, 2);
            entity.Property(e => e.FileMinhChungUrl).HasMaxLength(500);
            entity.Property(e => e.KetQua).HasMaxLength(1000);

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 10. Cấu hình thực thể TaiChinhCongDoan
        modelBuilder.Entity<TaiChinhCongDoan>(entity =>
        {
            entity.Property(e => e.LoaiGiaoDich).HasMaxLength(50).IsRequired();
            entity.Property(e => e.SoTien).HasPrecision(18, 2);
            entity.Property(e => e.NguoiGiaoDich).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ThangNam).HasMaxLength(7);
            entity.Property(e => e.GhiChu).HasMaxLength(500);

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DoanVien)
                .WithMany()
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 11. Cấu hình thực thể PhucLoiDoanVien
        modelBuilder.Entity<PhucLoiDoanVien>(entity =>
        {
            entity.Property(e => e.LoaiPhucLoi).HasMaxLength(50).IsRequired();
            entity.Property(e => e.KinhPhiHoTro).HasPrecision(18, 2);
            entity.Property(e => e.LyDo).HasMaxLength(500).IsRequired();
            entity.Property(e => e.FileMinhChungUrl).HasMaxLength(500);

            entity.HasOne(e => e.DoanVien)
                .WithMany()
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 12. Cấu hình thực thể SangKien
        modelBuilder.Entity<SangKien>(entity =>
        {
            entity.Property(e => e.TenDeTai).HasMaxLength(250).IsRequired();
            entity.Property(e => e.LinhVuc).HasMaxLength(100).IsRequired();
            entity.Property(e => e.CapDeTai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.HieuQuaKinhTe).HasMaxLength(1000);
            entity.Property(e => e.KetQuaNghiemThu).HasMaxLength(100);

            entity.HasOne(e => e.DoanVien)
                .WithMany()
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 13. Cấu hình thực thể ThiDuaCongDoan
        modelBuilder.Entity<ThiDuaCongDoan>(entity =>
        {
            entity.Property(e => e.TenPhongTrao).HasMaxLength(250).IsRequired();
            entity.Property(e => e.DiemTuDanhGia).HasPrecision(18, 2);
            entity.Property(e => e.DiemBchDuyet).HasPrecision(18, 2);
            entity.Property(e => e.XepLoai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.KhenThuong).HasMaxLength(250);

            entity.HasOne(e => e.DoanVien)
                .WithMany()
                .HasForeignKey(e => e.DoanVienId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.DonVi)
                .WithMany()
                .HasForeignKey(e => e.DonViId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // 14. Cấu hình Global Query Filter cho Soft Delete (IsDeleted == false)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var parameter = Expression.Parameter(entityType.ClrType, "e");
                var property = Expression.Property(parameter, nameof(BaseEntity.IsDeleted));
                var falseConstant = Expression.Constant(false);
                var compare = Expression.Equal(property, falseConstant);
                var lambda = Expression.Lambda(compare, parameter);

                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(lambda);
            }
        }
    }
}

