using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using QLCD.Application.Common.Interfaces;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Interceptors;
using QLCD.Infrastructure.Services;

namespace QLCD.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services, IConfiguration configuration, IHostEnvironment environment, bool migration = false)
    {
        var useInMemory = configuration.GetValue<bool>("Data:UseInMemory");
        string? connectionString = null;
        if (useInMemory)
        {
            if (migration || (!environment.IsDevelopment() && !environment.IsEnvironment("Testing")))
                throw new InvalidOperationException("In-memory data is restricted to Development and Testing.");
        }
        else
        {
            var connectionName = migration ? "Migration" : "DefaultConnection";
            connectionString = configuration.GetConnectionString(connectionName);
            if (string.IsNullOrWhiteSpace(connectionString))
                throw new InvalidOperationException($"Configure ConnectionStrings:{connectionName} before starting QLCD.");
            try
            {
                var connection = new SqlConnectionStringBuilder(connectionString);
                // A Windows development process can explicitly trust a local SQL Server over shared memory.
                var isLocalWindowsDevelopment = environment.IsDevelopment() && OperatingSystem.IsWindows()
                    && connection.IntegratedSecurity && connection.DataSource.StartsWith(@"lpc:.\", StringComparison.OrdinalIgnoreCase)
                    && string.IsNullOrEmpty(connection.FailoverPartner);
                var server = connection.DataSource.Split(',');
                var isLoopbackDevelopment = environment.IsDevelopment()
                    && configuration.GetValue<bool>("Data:TrustLocalSqlCertificate")
                    && server.Length <= 2
                    && (server.Length == 1 || (int.TryParse(server[1], out var port) && port is > 0 and <= 65535))
                    && (server[0].Equals("localhost", StringComparison.OrdinalIgnoreCase)
                        || server[0] == "127.0.0.1" || server[0] == "[::1]")
                    && string.IsNullOrEmpty(connection.FailoverPartner);
                connection.Encrypt = SqlConnectionEncryptOption.Mandatory;
                connection.TrustServerCertificate = (isLocalWindowsDevelopment || isLoopbackDevelopment)
                    && connection.TrustServerCertificate;
                connectionString = connection.ConnectionString;
            }
            catch (ArgumentException)
            {
                throw new InvalidOperationException($"Invalid SQL configuration for {connectionName}.");
            }
        }

        services.AddScoped<AuditLogInterceptor>();
        services.AddDbContext<QLCDDbContext>((provider, options) =>
        {
            if (useInMemory)
                options.UseInMemoryDatabase("QLCD_Development");
            else
                options.UseSqlServer(connectionString!);
            options.AddInterceptors(provider.GetRequiredService<AuditLogInterceptor>());
        });
        services.AddScoped<IQLCDDbContext>(provider => provider.GetRequiredService<QLCDDbContext>());
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IOrganizationScopeService, OrganizationScopeService>();
        services.AddSingleton<ICertificateLinkPolicy, CertificateLinkPolicy>();

        return services;
    }
}
