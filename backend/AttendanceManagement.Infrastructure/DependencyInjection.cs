using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using AttendanceManagement.Application.Common.Interfaces;
using AttendanceManagement.Infrastructure.Data;
using AttendanceManagement.Infrastructure.Interceptors;
using AttendanceManagement.Infrastructure.Services;

namespace AttendanceManagement.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // ÄÄƒng kÃ½ AuditLogInterceptor
        services.AddSingleton<AuditLogInterceptor>();

        // ÄÄƒng kÃ½ AttendanceDbContext (Sá»­ dá»¥ng SQL Server theo cáº¥u hÃ¬nh hoáº·c fallback sang InMemory náº¿u SQL Server khÃ´ng kháº£ dá»¥ng/khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c)
        services.AddDbContext<AttendanceDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditLogInterceptor>();
            
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            bool isDesignTime = AppDomain.CurrentDomain.GetAssemblies()
                .Any(a => a.FullName?.StartsWith("Microsoft.EntityFrameworkCore.Design") == true);
            bool useInMemory = string.IsNullOrEmpty(connectionString);
            
            if (useInMemory)
            {
                options.UseInMemoryDatabase("QLCD_InMemory_Db")
                       .AddInterceptors(auditInterceptor);
            }
            else
            {
                options.UseSqlServer(connectionString)
                       .AddInterceptors(auditInterceptor);
            }
        });

        // ÄÄƒng kÃ½ interface IAttendanceDbContext Ä‘á»ƒ Application cÃ³ thá»ƒ sá»­ dá»¥ng
        services.AddScoped<IAttendanceDbContext>(provider => provider.GetRequiredService<AttendanceDbContext>());

        // ÄÄƒng kÃ½ cÃ¡c dá»‹ch vá»¥ phÃ¢n quyá»n & pháº¡m vi
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IOrganizationScopeService, OrganizationScopeService>();
        services.AddScoped<IAttendanceCalculationService, AttendanceCalculationService>();

        return services;
    }
}
