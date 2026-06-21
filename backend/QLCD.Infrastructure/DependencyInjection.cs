using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using QLCD.Application.Common.Interfaces;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Interceptors;

namespace QLCD.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Đăng ký AuditLogInterceptor
        services.AddSingleton<AuditLogInterceptor>();

        // Đăng ký QLCDDbContext (Sử dụng SQL Server theo cấu hình hoặc fallback sang InMemory nếu SQL Server không khả dụng/không kết nối được)
        services.AddDbContext<QLCDDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditLogInterceptor>();
            
            var connectionString = configuration.GetConnectionString("DefaultConnection");
            bool useInMemory = string.IsNullOrEmpty(connectionString);
            
            if (!useInMemory)
            {
                try
                {
                    var cb = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(connectionString)
                    {
                        ConnectTimeout = 2 // Thử kết nối trong tối đa 2 giây để không làm chậm startup
                    };
                    using (var conn = new Microsoft.Data.SqlClient.SqlConnection(cb.ConnectionString))
                    {
                        conn.Open();
                    }
                }
                catch
                {
                    useInMemory = true;
                }
            }

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

        // Đăng ký interface IQLCDDbContext để Application có thể sử dụng
        services.AddScoped<IQLCDDbContext>(provider => provider.GetRequiredService<QLCDDbContext>());

        return services;
    }
}
