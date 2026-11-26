using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.ManagementBlocks;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.DeleteUnionUnit;
using QLCD.Application.Features.UnionUnits.Commands.UpdateUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Services;

namespace QLCD.Tests;

public sealed class ManagementBlockTests : IAsyncLifetime
{
    private QLCDDbContext db = null!;
    private bool sql;
    private readonly Guid legacyBlock = Guid.NewGuid(), rootId = Guid.NewGuid(), departmentId = Guid.NewGuid();
    private readonly User admin = new(Guid.NewGuid(), "ADMIN", null);
    public async Task InitializeAsync()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>();
        var connection = Environment.GetEnvironmentVariable("QLCD_TEST_BLOCK_SQL_CONNECTION");
        if (connection is null) options.UseInMemoryDatabase(Guid.NewGuid().ToString());
        else
        {
            var builder = new SqlConnectionStringBuilder(connection);
            if (!builder.InitialCatalog.StartsWith("QLCD_Test_", StringComparison.Ordinal)) throw new InvalidOperationException("Test database required.");
            builder.InitialCatalog = "QLCD_Test_Block_" + Guid.NewGuid().ToString("N");
            options.UseSqlServer(builder.ConnectionString); sql = true;
        }
        db = new QLCDDbContext(options.Options);
        if (sql)
        {
            Assert.False(db.Database.HasPendingModelChanges());
            await db.GetService<IMigrator>().MigrateAsync("20261125073114_SeparateActivationExpiry");
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO KhoiChuyenMons (Id,TenKhoi,CreatedDate,IsDeleted) VALUES ({legacyBlock},N'Khối Cơ quan cũ',SYSUTCDATETIME(),0)");
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO DonViCongDoans (Id,TenDonVi,LoaiToChuc,Level,TrangThai,CreatedDate,IsDeleted) VALUES ({rootId},N'Đơn vị chưa phân khối',1,1,1,SYSUTCDATETIME(),0)");
            await db.Database.ExecuteSqlInterpolatedAsync($"INSERT INTO DonViCongDoans (Id,TenDonVi,LoaiToChuc,Level,MaParent,MaKhoi,TrangThai,CreatedDate,IsDeleted) VALUES ({departmentId},N'CDBP Liên cơ quan',2,2,{rootId},{legacyBlock},1,SYSUTCDATETIME(),0)");
            await db.Database.MigrateAsync(); await db.Database.MigrateAsync();
        }
        else
        {
            db.KhoiChuyenMons.Add(new KhoiChuyenMon { Id = legacyBlock, TenKhoi = "Khối Cơ quan cũ" });
            db.DonViCongDoans.AddRange(new DonViCongDoan { Id = rootId, TenDonVi = "Đơn vị chưa phân khối", LoaiToChuc = LoaiToChuc.CDCS, Level = 1 },
                new DonViCongDoan { Id = departmentId, TenDonVi = "CDBP Liên cơ quan", LoaiToChuc = LoaiToChuc.CDBP, Level = 2, MaParent = rootId, MaKhoi = legacyBlock });
            await db.SaveChangesAsync();
        }
    }
    public async Task DisposeAsync() { if (sql) await db.Database.EnsureDeletedAsync(); await db.DisposeAsync(); }

    [Fact]
    public async Task AdminCreatesAndEditsCanonicalBlockInformationWithoutCreatingUnitsOrAccounts()
    {
        var id = await Save(new() { TenKhoi = "Khối mới", GhiChu = "Thông tin ban đầu" });
        await Save(new() { Id = id, TenKhoi = "Khối đổi tên", GhiChu = "Thông tin cập nhật" });
        var block = await db.KhoiChuyenMons.SingleAsync(b => b.Id == id);
        Assert.Equal("Khối đổi tên", block.TenKhoi); Assert.Equal("Thông tin cập nhật", block.GhiChu);
        Assert.Equal(2, await db.DonViCongDoans.CountAsync()); Assert.Empty(db.TaiKhoans);
        Assert.Equal(0, Assert.Single(await new GetManagementBlocksHandler(db, admin).Handle(new(Search: "đổi tên"), default)).UnitCount);
        await Assert.ThrowsAsync<OrganizationStateException>(() => Save(new() { TenKhoi = "KHỐI ĐỔI TÊN" }));
    }

    [Theory]
    [InlineData("CDCS")]
    [InlineData("CDBP")]
    [InlineData("TOCD")]
    public async Task NonAdministratorsCannotChangeBlocks(string role)
    {
        var handler = new SaveManagementBlockHandler(db, new User(Guid.NewGuid(), role, departmentId));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new() { TenKhoi = "Bị từ chối" }, default));
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => handler.Handle(new() { Id = legacyBlock, TenKhoi = "Bị từ chối" }, default));
        Assert.Equal("Khối Cơ quan cũ", (await db.KhoiChuyenMons.SingleAsync()).TenKhoi);
        var reader = new GetManagementBlocksHandler(db, new User(Guid.NewGuid(), role, departmentId));
        Assert.Null(Assert.Single(await reader.Handle(new(), default)).UnitCount);
    }

    [Fact]
    public async Task UpgradePreservesIdsAssignmentsAndUnclassifiedUnitsWithoutInventingClassification()
    {
        var block = await db.KhoiChuyenMons.SingleAsync();
        Assert.Equal(legacyBlock, block.Id); Assert.True(block.TrangThai); Assert.Null(block.GhiChu);
        Assert.Null((await db.DonViCongDoans.SingleAsync(u => u.Id == rootId)).MaKhoi);
        Assert.Equal(legacyBlock, (await db.DonViCongDoans.SingleAsync(u => u.Id == departmentId)).MaKhoi);
        var tree = await Tree(); Assert.Null(tree!.TenKhoi); Assert.Null(tree.MaKhoi);
        Assert.Equal("Khối Cơ quan cũ", Assert.Single(tree.Children).TenKhoi);
        Assert.Equal(2, await db.DonViCongDoans.CountAsync()); Assert.Empty(db.TaiKhoans);
        Assert.Equal(1, Assert.Single(await Blocks()).UnitCount);
    }

    [Fact]
    public async Task AdminCreatesAndRenamesBlockWithoutCreatingOrganizationsOrAccounts()
    {
        var id = await Save(new() { TenKhoi = "Khối mới", GhiChu = "Thông tin tổng hợp" });
        await Save(new() { Id = id, TenKhoi = "Khối Cơ quan", GhiChu = "Đã cập nhật" });
        var block = await db.KhoiChuyenMons.SingleAsync(b => b.Id == id);
        Assert.Equal("Khối Cơ quan", block.TenKhoi); Assert.Equal("Đã cập nhật", block.GhiChu);
        Assert.Equal(2, await db.DonViCongDoans.CountAsync()); Assert.Empty(db.TaiKhoans);
        await Assert.ThrowsAsync<OrganizationStateException>(() => Save(new() { TenKhoi = "khối cơ quan" }));
    }

    [Theory]
    [InlineData("CDCS")]
    [InlineData("CDBP")]
    [InlineData("TOCD")]
    public async Task NonAdminsCanReadButCannotManageBlocks(string role)
    {
        Assert.NotEmpty(await Blocks());
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() => new SaveManagementBlockHandler(db, new User(Guid.NewGuid(), role, departmentId))
            .Handle(new() { Id = legacyBlock, TenKhoi = "Không được sửa" }, default));
        Assert.Equal("Khối Cơ quan cũ", (await db.KhoiChuyenMons.SingleAsync()).TenKhoi);
    }

    [Fact]
    public async Task NewUnitsMustSelectAnExistingActiveBlock()
    {
        var handler = new CreateUnionUnitCommandHandler(db);
        foreach (var invalid in new Guid?[] { null, Guid.Empty, Guid.NewGuid() })
            await Assert.ThrowsAsync<OrganizationStateException>(() => handler.Handle(Unit(invalid), default));
        await Save(new() { Id = legacyBlock, TenKhoi = "Khối Cơ quan cũ", TrangThai = false, Confirmed = true });
        await Assert.ThrowsAsync<OrganizationStateException>(() => handler.Handle(Unit(legacyBlock), default));
        Assert.Equal(2, await db.DonViCongDoans.CountAsync()); Assert.Empty(db.TaiKhoans);
        var active = await Save(new() { TenKhoi = "Khối đang dùng" });
        var id = await handler.Handle(Unit(active), default);
        Assert.Equal(active, (await db.DonViCongDoans.SingleAsync(u => u.Id == id)).MaKhoi);
        Assert.Single(db.TaiKhoans);
    }

    [Fact]
    public async Task StopUsedBlockRequiresConfirmationAndDoesNotChangeOrganizationAccountScopeOrLinks()
    {
        var user = new User(Guid.NewGuid(), "CDBP", departmentId);
        var scope = new OrganizationScopeService(user, db);
        var before = await scope.GetAllowedOrganizationIdsAsync();
        var account = new TaiKhoan { Username = "fixture", HoTen = "Fixture", VaiTro = "CDBP", OrganizationId = departmentId,
            PasswordHash = "fixture-hash", TrangThai = false };
        db.TaiKhoans.Add(account); await db.SaveChangesAsync();
        var stamp = account.SecurityVersion;
        await Assert.ThrowsAsync<OrganizationStateException>(() => Save(new() { Id = legacyBlock, TenKhoi = "Khối Cơ quan cũ", TrangThai = false }));
        await Save(new() { Id = legacyBlock, TenKhoi = "Khối Cơ quan đổi tên", TrangThai = false, Confirmed = true });
        var unit = await db.DonViCongDoans.SingleAsync(u => u.Id == departmentId);
        Assert.Equal(legacyBlock, unit.MaKhoi); Assert.Equal(1, unit.TrangThai); Assert.False(unit.IsDeleted);
        Assert.False(account.TrangThai); Assert.Equal(stamp, account.SecurityVersion); Assert.Equal("fixture-hash", account.PasswordHash);
        Assert.Equal(before, await scope.GetAllowedOrganizationIdsAsync());
        var tree = await Tree(); var child = Assert.Single(tree!.Children);
        Assert.Equal("Khối Cơ quan đổi tên", child.TenKhoi); Assert.False(child.KhoiDangSuDung);
        Assert.Empty(await new GetManagementBlocksHandler(db, admin).Handle(new(ActiveOnly: true), default));
        Assert.Equal(1, Assert.Single(await Blocks()).UnitCount);
        await new DeleteUnionUnitCommandHandler(db, admin).Handle(new(departmentId), default);
        Assert.Equal(legacyBlock, unit.MaKhoi);
        Assert.Equal(1, Assert.Single(await Blocks()).UnitCount);
        await new RestoreUnionUnitCommandHandler(db, admin).Handle(new(departmentId), default);
        Assert.Equal(legacyBlock, unit.MaKhoi); Assert.False(account.TrangThai); Assert.Equal(1, unit.TrangThai);
    }

    [Fact]
    public async Task LegacyClassificationIsExplicitAndExistingStoppedAssignmentsCanBePreservedButNotCleared()
    {
        var handler = new UpdateUnionUnitCommandHandler(db, admin);
        await handler.Handle(new() { Id = rootId, TenDonVi = "Đơn vị chưa phân khối", TrangThai = 1 }, default);
        Assert.Null((await db.DonViCongDoans.SingleAsync(u => u.Id == rootId)).MaKhoi);
        await handler.Handle(new() { Id = rootId, TenDonVi = "Đơn vị chưa phân khối", TrangThai = 1, MaKhoi = legacyBlock }, default);
        await Save(new() { Id = legacyBlock, TenKhoi = "Khối Cơ quan cũ", TrangThai = false, Confirmed = true });
        await handler.Handle(new() { Id = rootId, TenDonVi = "Đổi tên giữ khối", TrangThai = 1, MaKhoi = legacyBlock }, default);
        await Assert.ThrowsAsync<OrganizationStateException>(() => handler.Handle(new() { Id = rootId, TenDonVi = "Không xóa khối", TrangThai = 1 }, default));
        Assert.Equal(legacyBlock, (await db.DonViCongDoans.SingleAsync(u => u.Id == rootId)).MaKhoi);
    }

    private CreateUnionUnitCommand Unit(Guid? block) => new() { TenDonVi = "Đơn vị mới", LoaiToChuc = LoaiToChuc.CDBP, MaParent = rootId, MaKhoi = block };
    private Task<Guid> Save(SaveManagementBlock request) => new SaveManagementBlockHandler(db, admin).Handle(request, default);
    private Task<List<ManagementBlockDto>> Blocks() => new GetManagementBlocksHandler(db, admin).Handle(new(), default);
    private Task<UnionUnitDto?> Tree() => new GetUnionUnitsTreeQueryHandler(db, admin, new OrganizationScopeService(admin, db)).Handle(new(), default);
    private sealed record User(Guid Id, string Role, Guid? OrganizationId) : ICurrentUserService
    {
        public Guid? UserId => Id; public string Username => "fixture-admin";
        public bool IsAdmin => Role == "ADMIN"; public bool IsCdcs => Role == "CDCS"; public bool IsCdbp => Role == "CDBP"; public bool IsTocd => Role == "TOCD";
    }
}
