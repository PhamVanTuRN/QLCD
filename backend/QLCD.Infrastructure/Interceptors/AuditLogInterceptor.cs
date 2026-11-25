using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Common;
using QLCD.Domain.Entities;

namespace QLCD.Infrastructure.Interceptors;

public sealed class AuditLogInterceptor(ICurrentUserService currentUser, IHttpContextAccessor requests) : SaveChangesInterceptor
{
    private static readonly HashSet<string> AuditablePropertyNames = new(StringComparer.Ordinal)
    {
        "TrangThai", "IsDeleted", "OrganizationId", "DonViId", "MaToCongDoan",
        "VaiTro", "MaParent", "RelatedEntityId", "MustChangePassword"
    };

    public override InterceptionResult<int> SavingChanges(DbContextEventData eventData, InterceptionResult<int> result)
    {
        AddEvents(eventData.Context);
        return result;
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(DbContextEventData eventData,
        InterceptionResult<int> result, CancellationToken cancellationToken = default)
    {
        AddEvents(eventData.Context);
        return ValueTask.FromResult(result);
    }

    private void AddEvents(DbContext? context)
    {
        if (context is null)
            return;

        var actor = currentUser.UserId?.ToString() ?? "System";
        var correlation = requests.HttpContext?.TraceIdentifier ?? Activity.Current?.TraceId.ToString();
        var entries = context.ChangeTracker.Entries<BaseEntity>()
            .Where(entry => entry.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();
        foreach (var entry in entries)
        {
            var action = entry.State switch
            {
                EntityState.Added => "INSERT",
                EntityState.Deleted => "DELETE",
                _ when entry.Entity.IsDeleted && entry.Property(e => e.IsDeleted).IsModified => "SOFT_DELETE",
                _ => "UPDATE"
            };
            var fields = entry.Properties
                .Where(property => property.IsModified && AuditablePropertyNames.Contains(property.Metadata.Name))
                .Select(property => property.Metadata.Name)
                .ToArray();
            context.Set<AuditLog>().Add(new AuditLog
            {
                EntityName = entry.Metadata.ClrType.Name,
                RecordId = entry.Entity.Id,
                Action = action,
                UserId = actor,
                CorrelationId = correlation,
                NewValues = fields.Length == 0 ? null : JsonSerializer.Serialize(fields)
            });
        }
    }
}
