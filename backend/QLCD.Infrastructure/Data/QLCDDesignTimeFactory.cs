using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace QLCD.Infrastructure.Data;

public sealed class QLCDDesignTimeFactory : IDesignTimeDbContextFactory<QLCDDbContext>
{
    public QLCDDbContext CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<QLCDDbContext>().UseSqlServer().Options);
}
