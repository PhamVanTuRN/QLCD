using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using AttendanceManagement.Domain.Entities;

namespace AttendanceManagement.Application.Common.Interfaces;

public interface IAttendanceDbContext
{
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<DanhMucDungChung> DanhMucDungChungs { get; }
    DbSet<EvidenceFile> EvidenceFiles { get; }

    DbSet<Department> Departments { get; }
    DbSet<Person> Persons { get; }
    DbSet<UserAccount> UserAccounts { get; }
    
    DbSet<Location> Locations { get; }
    DbSet<AttendanceSource> AttendanceSources { get; }
    DbSet<AttendanceDevice> AttendanceDevices { get; }
    
    DbSet<Event> Events { get; }
    DbSet<EventSession> EventSessions { get; }
    DbSet<EventLocation> EventLocations { get; }
    DbSet<EventDevice> EventDevices { get; }
    DbSet<EventParticipant> EventParticipants { get; }
    DbSet<AttendanceRule> AttendanceRules { get; }
    
    DbSet<RawAttendanceLog> RawAttendanceLogs { get; }
    DbSet<AttendanceResult> AttendanceResults { get; }
    DbSet<AttendanceAdjustment> AttendanceAdjustments { get; }
    DbSet<AttendanceFeedback> AttendanceFeedbacks { get; }

    DatabaseFacade Database { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
