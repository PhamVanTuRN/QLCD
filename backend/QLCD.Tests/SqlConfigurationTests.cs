using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using QLCD.Infrastructure;
using QLCD.Infrastructure.Data;

namespace QLCD.Tests;

public sealed class SqlConfigurationTests
{
    [Theory]
    [InlineData("Development", "localhost,1433", true, true)]
    [InlineData("Development", "127.0.0.1,1433", true, true)]
    [InlineData("Development", "[::1],1433", true, true)]
    [InlineData("Development", "localhost,1433", false, false)]
    [InlineData("Production", "localhost,1433", true, false)]
    [InlineData("Testing", "localhost,1433", true, false)]
    [InlineData("Development", "sql.example.com,1433", true, false)]
    [InlineData("Development", "localhost.example.com,1433", true, false)]
    public void CertificateTrustRequiresExplicitDevelopmentLoopback(string environment, string server, bool optIn, bool expected)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:DefaultConnection"] = $"Server={server};Database=Test;User Id=test;Password=test;Encrypt=False;TrustServerCertificate=True",
            ["Data:TrustLocalSqlCertificate"] = optIn.ToString()
        }).Build();
        var services = new ServiceCollection();
        services.AddInfrastructureServices(config, new HostEnvironment { EnvironmentName = environment });
        using var provider = services.BuildServiceProvider();
        using var scope = provider.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<QLCDDbContext>();
        var connection = new SqlConnectionStringBuilder(database.Database.GetConnectionString());
        Assert.Equal(expected, connection.TrustServerCertificate);
        Assert.Equal(SqlConnectionEncryptOption.Mandatory, connection.Encrypt);
    }

    private sealed class HostEnvironment : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = "Development";
        public string ApplicationName { get; set; } = "Test";
        public string ContentRootPath { get; set; } = ".";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    }
}
