using System;
using System.Linq;
using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Domain.Common;
using AttendanceManagement.Domain.Entities;

namespace AttendanceManagement.Infrastructure.Data;

public class AttendanceDbContext : DbContext, IAttendanceDbContext
{
    public AttendanceDbContext(DbContextOptions<AttendanceDbContext> options) : base(options)
    {
    }

    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<DanhMucDungChung> DanhMucDungChungs { get; set; } = null!;
    public DbSet<EvidenceFile> EvidenceFiles { get; set; } = null!;

    public DbSet<Department> Departments { get; set; } = null!;
    public DbSet<Person> Persons { get; set; } = null!;
    public DbSet<UserAccount> UserAccounts { get; set; } = null!;
    
    public DbSet<Location> Locations { get; set; } = null!;
    public DbSet<AttendanceSource> AttendanceSources { get; set; } = null!;
    public DbSet<AttendanceDevice> AttendanceDevices { get; set; } = null!;
    
    public DbSet<Event> Events { get; set; } = null!;
    public DbSet<EventSession> EventSessions { get; set; } = null!;
    public DbSet<EventLocation> EventLocations { get; set; } = null!;
    public DbSet<EventDevice> EventDevices { get; set; } = null!;
    public DbSet<EventParticipant> EventParticipants { get; set; } = null!;
    public DbSet<AttendanceRule> AttendanceRules { get; set; } = null!;
    
    public DbSet<RawAttendanceLog> RawAttendanceLogs { get; set; } = null!;
    public DbSet<AttendanceResult> AttendanceResults { get; set; } = null!;
    public DbSet<AttendanceAdjustment> AttendanceAdjustments { get; set; } = null!;
    public DbSet<AttendanceFeedback> AttendanceFeedbacks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Keep standard infrastructure configurations
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(e => e.EntityName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Action).HasMaxLength(20).IsRequired();
        });

        modelBuilder.Entity<DanhMucDungChung>(entity =>
        {
            entity.HasIndex(e => new { e.Loai, e.Ma }).IsUnique();
            entity.Property(e => e.Loai).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Ma).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Ten).HasMaxLength(250).IsRequired();
            entity.Property(e => e.GhiChu).HasMaxLength(500);
        });

        modelBuilder.Entity<EvidenceFile>(entity =>
        {
            entity.Property(e => e.OriginalFileName).HasMaxLength(250).IsRequired();
            entity.Property(e => e.StoredFileName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.FileExtension).HasMaxLength(10).IsRequired();
            entity.Property(e => e.ContentType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.StoragePath).HasMaxLength(500).IsRequired();
            entity.Property(e => e.ModuleName).HasMaxLength(50).IsRequired();
        });

        // New Entities configurations
        modelBuilder.Entity<Department>(entity =>
        {
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(250).IsRequired();
            
            entity.HasOne(e => e.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Person>(entity =>
        {
            entity.HasIndex(e => e.CCCD).IsUnique();
            entity.HasIndex(e => e.Code).IsUnique();
            
            entity.Property(e => e.CCCD).HasMaxLength(20).IsRequired();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(150).IsRequired();

            entity.HasOne(e => e.Department)
                .WithMany(d => d.Persons)
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserAccount>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(250).IsRequired();
            entity.Property(e => e.FullName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Role).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(250).IsRequired();
            entity.Property(e => e.PhysicalLocation).HasMaxLength(500);
        });

        modelBuilder.Entity<AttendanceSource>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(250).IsRequired();
        });

        modelBuilder.Entity<AttendanceDevice>(entity =>
        {
            entity.Property(e => e.DeviceCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.DeviceName).HasMaxLength(250).IsRequired();
            entity.Property(e => e.DeviceType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.IPAddress).HasMaxLength(50);
            entity.Property(e => e.SerialNumber).HasMaxLength(100);

            entity.HasOne(e => e.Location)
                .WithMany(l => l.AttendanceDevices)
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SourceSystem)
                .WithMany()
                .HasForeignKey(e => e.SourceSystemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Event>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(250).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.EventType).HasMaxLength(50);
            entity.Property(e => e.ExternalId).HasMaxLength(100);
            entity.Property(e => e.ExternalCode).HasMaxLength(100);
            entity.Property(e => e.SourceSystem).HasMaxLength(50);
        });

        modelBuilder.Entity<EventSession>(entity =>
        {
            entity.Property(e => e.SessionName).HasMaxLength(250).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(20);

            entity.HasOne(e => e.Event)
                .WithMany(e => e.Sessions)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventLocation>(entity =>
        {
            entity.HasOne(e => e.Event)
                .WithMany(e => e.EventLocations)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Location)
                .WithMany()
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EventDevice>(entity =>
        {
            entity.HasOne(e => e.Event)
                .WithMany(e => e.EventDevices)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Location)
                .WithMany()
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Device)
                .WithMany()
                .HasForeignKey(e => e.DeviceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EventParticipant>(entity =>
        {
            entity.Property(e => e.Status).HasMaxLength(20).IsRequired();
            entity.Property(e => e.ParticipantType).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.Event)
                .WithMany(e => e.Participants)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Department)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.AssignedLocation)
                .WithMany()
                .HasForeignKey(e => e.AssignedLocationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AttendanceRule>(entity =>
        {
            entity.Property(e => e.AttendanceType).HasMaxLength(50).IsRequired();

            entity.HasOne(e => e.EventSession)
                .WithMany(e => e.AttendanceRules)
                .HasForeignKey(e => e.EventSessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<RawAttendanceLog>(entity =>
        {
            entity.Property(e => e.CCCD).HasMaxLength(20);
            entity.Property(e => e.ExternalLogId).HasMaxLength(100);
            entity.Property(e => e.AttendanceMethod).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ValidationMessage).HasMaxLength(500);
            entity.Property(e => e.RecognitionScore).HasPrecision(5, 2);

            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Location)
                .WithMany()
                .HasForeignKey(e => e.LocationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Device)
                .WithMany()
                .HasForeignKey(e => e.DeviceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AttendanceResult>(entity =>
        {
            entity.Property(e => e.AttendanceStatus).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CCCD).HasMaxLength(20);
            entity.Property(e => e.ManualOverrideReason).HasMaxLength(500);
            entity.Property(e => e.ResultReason).HasMaxLength(500);

            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AttendanceAdjustment>(entity =>
        {
            entity.Property(e => e.AdjustmentType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Reason).HasMaxLength(500).IsRequired();
            entity.Property(e => e.OldValue).HasMaxLength(250);
            entity.Property(e => e.NewValue).HasMaxLength(250);
            entity.Property(e => e.EvidenceUrl).HasMaxLength(500);

            entity.HasOne(e => e.Result)
                .WithMany()
                .HasForeignKey(e => e.ResultId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.AdjustedByUser)
                .WithMany()
                .HasForeignKey(e => e.AdjustedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AttendanceFeedback>(entity =>
        {
            entity.Property(e => e.Content).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Status).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReviewNotes).HasMaxLength(1000);

            entity.HasOne(e => e.Event)
                .WithMany()
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Person)
                .WithMany()
                .HasForeignKey(e => e.PersonId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Global Query Filter cho Soft Delete (IsDeleted == false)
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
