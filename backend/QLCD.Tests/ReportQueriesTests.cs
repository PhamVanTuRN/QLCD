using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using QLCD.Application.Common;
using QLCD.Application.Common.Interfaces;
using QLCD.Application.Features.Accounts.Queries.GetAccounts;
using QLCD.Application.Features.Emulations.Queries.GetEmulations;
using QLCD.Application.Features.Finance.Queries.GetFinance;
using QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;
using QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionStats;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using QLCD.Infrastructure.Services;

namespace QLCD.Tests;

public sealed class ReportQueriesTests
{
    [Fact]
    public async Task AccountsSearchFiltersBeforePaginationAndKeepsUnlinkedDeletedAccountsHidden()
    {
        await using var database = CreateDatabase();
        var unit = new DonViCongDoan { TenDonVi = "Công đoàn Mẫu Đông", LoaiToChuc = LoaiToChuc.CDBP, Level = 2 };
        database.DonViCongDoans.Add(unit);
        database.TaiKhoans.AddRange(
            Account("search-recent", "Unrelated record", 4),
            Account("search_old", "Người quản lý mẫu", 1, unit.Id),
            Account("search-deleted", "Người quản lý mẫu", 3, deleted: true));
        await database.SaveChangesAsync();

        var query = new GetAccountsQueryHandler(database);
        var first = await query.Handle(new GetAccountsQuery { PageSize = 1 }, default);
        Assert.Equal("search-recent", first[0].Username);
        var organization = new GetAccountsQuery { Search = "  MẪU ĐÔNG  ", PageSize = 1 };
        var match = Assert.Single(await query.Handle(organization, default));
        Assert.Equal("search_old", match.Username);
        Assert.Equal(unit.Id, match.OrganizationId);
        Assert.Empty(await query.Handle(organization with { Page = 2 }, default));
        Assert.Equal(match.Id, Assert.Single(await query.Handle(new GetAccountsQuery { Search = "QUẢN LÝ" }, default)).Id);
        Assert.Equal(match.Id, Assert.Single(await query.Handle(new GetAccountsQuery { Search = "SEARCH_OLD" }, default)).Id);
        Assert.Empty(await query.Handle(new GetAccountsQuery { Search = "%" }, default));

        static TaiKhoan Account(string username, string name, int day, Guid? organizationId = null, bool deleted = false) => new()
        {
            Username = username, HoTen = name, PasswordHash = "fixture-only", VaiTro = "CDBP",
            OrganizationId = organizationId, CreatedDate = new DateTime(2025, 1, day), IsDeleted = deleted
        };
    }

    [Fact]
    public async Task FinanceTotalsUseTheFilteredScopeBeforePagination()
    {
        await using var database = CreateDatabase();
        var unit = Unit();
        var other = Unit();
        database.DonViCongDoans.AddRange(unit, other);
        database.TaiChinhCongDoans.AddRange(
            Transaction(unit, "THU_DOAN_PHI", 500, "TESTFIN", 25),
            Transaction(unit, "CHI_HOAT_DONG", 150, "TESTFIN", 26),
            Transaction(unit, "THU_DOAN_PHI", 120, "TESTFIN", 27),
            Transaction(unit, "THU_DOAN_PHI", 1000, "OTHER", 25),
            Transaction(other, "THU_DOAN_PHI", 9999, "TESTFIN", 25));
        database.DanhMucDungChungs.AddRange(
            new DanhMucDungChung { Loai = "LoaiThuChi", Ma = "THU_DOAN_PHI", Ten = "Đoàn phí" },
            new DanhMucDungChung { Loai = "LoaiDoanPhi", Ma = "THU_DOAN_PHI", Ten = "Danh mục cũ" });
        await database.SaveChangesAsync();
        var user = new FixtureUser("CDBP", unit.Id);
        var scope = new OrganizationScopeService(user, database);
        var query = new GetFinanceQueryHandler(database, scope, user);
        var first = await query.Handle(new GetFinanceQuery { Search = "TESTFIN", PageSize = 1 }, default);
        var second = await query.Handle(new GetFinanceQuery { Search = "TESTFIN", Page = 2, PageSize = 1 }, default);
        Assert.Equal(new FinanceTotals(620, 150), first.Totals);
        Assert.Equal(first.Totals, second.Totals);
        Assert.Equal("Đoàn phí", first.Items[0].TenLoaiGiaoDich);
        Assert.NotEqual(first.Items[0].Id, second.Items[0].Id);
        var empty = await query.Handle(new GetFinanceQuery { Search = "none" }, default);
        Assert.Empty(empty.Items);
        Assert.Equal(new FinanceTotals(0, 0), empty.Totals);

        var teamUser = new FixtureUser("TOCD", unit.Id);
        var teamQuery = new GetFinanceQueryHandler(database, new OrganizationScopeService(teamUser, database), teamUser);
        var team = await teamQuery.Handle(new GetFinanceQuery { Search = "TESTFIN" }, default);
        Assert.Equal(new FinanceTotals(620, 0), team.Totals);
        Assert.Equal(2, team.Items.Count);
    }

    [Fact]
    public async Task EmulationSummaryCountsEvaluatedAndAwardedRecordsWithinYearAndScope()
    {
        await using var database = CreateDatabase();
        var unit = Unit();
        var other = Unit();
        database.DonViCongDoans.AddRange(unit, other);
        database.ThiDuaCongDoans.AddRange(
            Emulation(unit, 2026, 1), Emulation(unit, 2026, 2), Emulation(unit, 2026, 3),
            Emulation(unit, 2025, 3), Emulation(other, 2026, 3));
        await database.SaveChangesAsync();
        var scope = new OrganizationScopeService(new FixtureUser("TOCD", unit.Id), database);
        var query = new GetEmulationSummaryQueryHandler(database, scope);
        var result = await query.Handle(new GetEmulationSummaryQuery(2026), default);
        Assert.Equal(2026, result.Year);
        Assert.Equal(1, result.Registered);
        Assert.Equal(1, result.Evaluated);
        Assert.Equal(1, result.Awarded);
        Assert.Equal(2, Assert.Single(result.Ratings).Count);
        Assert.Empty((await query.Handle(new GetEmulationSummaryQuery(2024), default)).Ratings);
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() => query.Handle(new GetEmulationSummaryQuery(2101), default));
    }

    [Fact]
    public async Task MonthlyStatsUseVietnamCalendarAndOutgoingTransfers()
    {
        await using var database = CreateDatabase();
        var unit = Unit();
        var other = Unit();
        var member = new DoanVien { HoTen = "Report fixture", SoCCCD = "000000000824", MaNhanVien = "REPORT824", MaToCongDoan = unit.Id };
        database.DonViCongDoans.AddRange(unit, other);
        database.DoanViens.Add(member);
        var edge = new DateTime(2026, 10, 31, 17, 0, 0, DateTimeKind.Utc);
        database.LichSuBienDongs.AddRange(
            Change(LoaiBienDong.KetNapMoi, edge, null, unit.Id),
            Change(LoaiBienDong.KetNapMoi, edge.AddSeconds(-1), null, unit.Id),
            Change(LoaiBienDong.ChuyenSinhHoat, edge.AddHours(1), other.Id, unit.Id),
            Change(LoaiBienDong.ChuyenSinhHoat, edge.AddDays(1), unit.Id, other.Id),
            Change(LoaiBienDong.NghiHuu, edge.AddDays(30), unit.Id, null));
        await database.SaveChangesAsync();

        var user = new FixtureUser("TOCD", unit.Id);
        var query = new GetUnionStatsQueryHandler(database, user, new OrganizationScopeService(user, database),
            new FixedClock(new DateTimeOffset(edge.AddDays(5))));
        var result = await query.Handle(new GetUnionStatsQuery(), default);
        Assert.Equal(1, result.KetNapMoiThang);
        Assert.Equal(1, result.ChuyenDiThang);
        Assert.Equal(0, result.NghiHuuThang);
        Assert.Equal(1, Assert.Single(result.DoanVienTheoToCd).Count);

        LichSuBienDong Change(LoaiBienDong kind, DateTime when, Guid? from, Guid? to) => new()
        {
            DoanVienId = member.Id, LoaiBienDong = kind, NgayHieuLuc = when,
            TuToCongDoanId = from, DenToCongDoanId = to, LyDo = "Report fixture"
        };
    }

    [Fact]
    public async Task DepartmentCanAdmitDirectlyUntilItHasATeam()
    {
        await using var database = CreateDatabase();
        var department = new DonViCongDoan { TenDonVi = "Admission fixture", LoaiToChuc = LoaiToChuc.CDBP, Level = 2 };
        database.DonViCongDoans.Add(department);
        await database.SaveChangesAsync();

        var user = new FixtureUser("CDBP", department.Id);
        var scope = new OrganizationScopeService(user, database);
        var tree = new GetUnionUnitsTreeQueryHandler(database, user, scope);
        var admission = new CreateUnionMemberCommandHandler(database, scope,
            new CertificateLinkPolicy(new ConfigurationBuilder().Build()), user);
        var input = new CreateUnionMemberCommand
        {
            HoTen = "Fixture direct admission", SoCCCD = "000000000826", MaNhanVien = "REPORT826",
            MaToCongDoan = department.Id, NgaySinh = new DateTime(1990, 1, 1), NgayVaoCongDoan = new DateTime(2025, 1, 1)
        };

        Assert.True((await tree.Handle(new GetUnionUnitsTreeQuery(), default))!.CoTheTiepNhanDoanVien);
        var memberId = await admission.Handle(input, default);
        Assert.Equal(department.Id, (await database.DoanViens.SingleAsync(member => member.Id == memberId)).MaToCongDoan);

        database.DonViCongDoans.Add(new DonViCongDoan
        {
            TenDonVi = "Inactive admission fixture", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
            Level = 3, MaParent = department.Id, TrangThai = 0
        });
        await database.SaveChangesAsync();
        var result = (await tree.Handle(new GetUnionUnitsTreeQuery(), default))!;
        Assert.Empty(result.Children);
        Assert.False(result.CoTheTiepNhanDoanVien);
        Assert.Equal(1, result.SoDoanVien);
        await Assert.ThrowsAsync<FluentValidation.ValidationException>(() => admission.Handle(
            input with { SoCCCD = "000000000827", MaNhanVien = "REPORT827" }, default));
    }

    [SqlServerFact]
    public async Task ConcurrentTransferRejectionRollsBackTheExtraHistoryOnSqlServer()
    {
        await using var first = CreateDatabase();
        await using var second = CreateDatabase();
        var source = Unit();
        var destination = Unit();
        var member = new DoanVien { HoTen = "Transfer fixture", SoCCCD = "000000000825", MaNhanVien = "REPORT825", MaToCongDoan = source.Id };
        first.DonViCongDoans.AddRange(source, destination);
        first.DoanViens.Add(member);
        await first.SaveChangesAsync();

        // Both contexts observe the original organization before either issues its update.
        var stale = await second.DoanViens.SingleAsync(row => row.Id == member.Id);
        Assert.Equal(source.Id, stale.MaToCongDoan);
        var request = new TransferUnionMemberCommand
        {
            DoanVienId = member.Id,
            DenToCongDoanId = destination.Id,
            NgayHieuLuc = new DateTime(2026, 11, 1),
            LyDo = "Transfer fixture"
        };

        Assert.True(await Handler(first).Handle(request, default));
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => Handler(second).Handle(request, default));
        first.ChangeTracker.Clear();
        Assert.Equal(destination.Id, (await first.DoanViens.SingleAsync(row => row.Id == member.Id)).MaToCongDoan);
        Assert.Equal(1, await first.LichSuBienDongs.CountAsync(row => row.DoanVienId == member.Id));

        static TransferUnionMemberCommandHandler Handler(QLCDDbContext database)
        {
            var user = new FixtureUser("ADMIN", null);
            var scope = new OrganizationScopeService(user, database);
            return new TransferUnionMemberCommandHandler(database, scope, user,
                new EvidenceLinks(database, user, scope, TimeProvider.System));
        }
    }

    private static QLCDDbContext CreateDatabase()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>();
        var connection = Environment.GetEnvironmentVariable("QLCD_TEST_SQL_CONNECTION");
        if (connection is null)
            return new QLCDDbContext(options.UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        var builder = new SqlConnectionStringBuilder(connection);
        if (!builder.InitialCatalog.StartsWith("QLCD_Test_", StringComparison.Ordinal))
            throw new InvalidOperationException("Report tests require an isolated QLCD_Test_ database.");
        return new QLCDDbContext(options.UseSqlServer(builder.ConnectionString).Options);
    }

    [SqlServerFact]
    public async Task ConcurrentScopeApprovalAndArchiveChangesRejectStaleWrites()
    {
        await using var first = CreateDatabase();
        await using var second = CreateDatabase();
        var source = Unit();
        var destination = Unit();
        var member = new DoanVien { HoTen = "Scoped write fixture", SoCCCD = "000000000828", MaNhanVien = "REPORT828", MaToCongDoan = source.Id };
        var welfare = new PhucLoiDoanVien { DonViId = source.Id, DoanVienId = member.Id, LoaiPhucLoi = "FIXTURE", LyDo = "Original" };
        first.DonViCongDoans.AddRange(source, destination);
        first.DoanViens.Add(member);
        first.PhucLoiDoanViens.Add(welfare);
        await first.SaveChangesAsync();

        var stale = await second.PhucLoiDoanViens.SingleAsync(row => row.Id == welfare.Id);
        welfare.TrangThai = 2;
        await first.SaveChangesAsync();
        stale.LyDo = "Stale after approval";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());

        await second.Entry(stale).ReloadAsync();
        welfare.DonViId = destination.Id;
        await first.SaveChangesAsync();
        stale.LyDo = "Stale after transfer";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());

        await second.Entry(stale).ReloadAsync();
        welfare.IsDeleted = true;
        await first.SaveChangesAsync();
        stale.LyDo = "Stale after archive";
        await Assert.ThrowsAsync<DbUpdateConcurrencyException>(() => second.SaveChangesAsync());
        first.ChangeTracker.Clear();
        var saved = await first.PhucLoiDoanViens.IgnoreQueryFilters().SingleAsync(row => row.Id == welfare.Id);
        Assert.Equal((destination.Id, 2, true, "Original"), (saved.DonViId, saved.TrangThai, saved.IsDeleted, saved.LyDo));
    }

    private static DonViCongDoan Unit() =>
        new() { TenDonVi = "Report fixture", LoaiToChuc = LoaiToChuc.TO_CD_TRUC_THUOC_CDCS, Level = 2 };

    private static TaiChinhCongDoan Transaction(DonViCongDoan unit, string type, decimal amount, string note, int day) =>
        new() { DonViId = unit.Id, LoaiGiaoDich = type, SoTien = amount, NguoiGiaoDich = note, NgayGiaoDich = new DateTime(2026, 4, day) };

    private static ThiDuaCongDoan Emulation(DonViCongDoan unit, int year, int status) =>
        new() { DonViId = unit.Id, Nam = year, TrangThai = status, TenPhongTrao = "Report fixture", XepLoai = "HOAN_THANH_TOT" };

    private sealed record FixtureUser(string? Role, Guid? OrganizationId) : ICurrentUserService
    {
        public Guid? UserId => null;
        public string? Username => null;
        public bool IsAdmin => false;
        public bool IsCdcs => false;
        public bool IsCdbp => Role == "CDBP";
        public bool IsTocd => Role == "TOCD";
    }

    private sealed class FixedClock(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}

internal sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (Environment.GetEnvironmentVariable("QLCD_TEST_SQL_CONNECTION") is null)
            Skip = "Run tools/test-sql.ps1 to supply an isolated SQL Server fixture.";
    }
}
