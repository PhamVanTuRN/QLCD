using Xunit;
using Xunit.Abstractions;
using Microsoft.EntityFrameworkCore;
using QLCD.Infrastructure.Data;
using System.Linq;

namespace QLCD.Tests;

public class UnitTest1
{
    private readonly ITestOutputHelper _output;

    public UnitTest1(ITestOutputHelper output)
    {
        _output = output;
    }

    [Fact]
    public void TestDatabaseData()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>()
            .UseSqlServer("Server=localhost,1433;Database=qlcd;User Id=sa;Password=SqlServer@2026Dev!;MultipleActiveResultSets=True;TrustServerCertificate=True;")
            .Options;

        using var context = new QLCDDbContext(options);

        var units = context.DonViCongDoans.AsNoTracking().ToList();
        _output.WriteLine("=== DON VI CONG DOAN ===");
        foreach (var u in units)
        {
            _output.WriteLine($"Id: {u.Id}, Name: {u.TenDonVi}, LoaiToChuc: {u.LoaiToChuc}, Level: {u.Level}, MaParent: {u.MaParent}");
        }

        var members = context.DoanViens.AsNoTracking().ToList();
        _output.WriteLine("=== DOAN VIEN ===");
        foreach (var m in members)
        {
            _output.WriteLine($"Id: {m.Id}, Name: {m.HoTen}, Status: {m.TrangThai}, OrgId: {m.MaToCongDoan}");
        }
    }
}