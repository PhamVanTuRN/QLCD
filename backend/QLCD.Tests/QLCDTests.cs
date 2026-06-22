using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;
using QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;
using QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;
using QLCD.Application.Features.UnionUnits.Queries.GetUnionUnitsTree;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;
using QLCD.Infrastructure.Data;
using Xunit;

namespace QLCD.Tests;

public class QLCDTests
{
    private QLCDDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<QLCDDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new QLCDDbContext(options);
    }

    private async Task SeedRootCdcs(QLCDDbContext context)
    {
        var root = new DonViCongDoan
        {
            TenDonVi = "Công đoàn Cơ sở Bệnh viện TWQĐ 108",
            LoaiToChuc = LoaiToChuc.CDCS,
            Level = 1,
            MaParent = null,
            TrangThai = 1
        };

        context.DonViCongDoans.Add(root);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task CreateUnionUnit_SecondCdcs_ShouldThrowException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        await SeedRootCdcs(context);
        var handler = new CreateUnionUnitCommandHandler(context);

        var command = new CreateUnionUnitCommand
        {
            TenDonVi = "Công đoàn Cơ sở thứ hai",
            LoaiToChuc = LoaiToChuc.CDCS,
            MaParent = null
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateUnionUnit_CdbpUnderCdbp_ShouldThrowException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        await SeedRootCdcs(context);
        var root = await context.DonViCongDoans.FirstAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS);

        var cdbp1 = new DonViCongDoan
        {
            TenDonVi = "CĐBP Ngoại",
            LoaiToChuc = LoaiToChuc.CDBP,
            Level = 2,
            MaParent = root.Id,
            TrangThai = 1
        };
        context.DonViCongDoans.Add(cdbp1);
        await context.SaveChangesAsync();

        var handler = new CreateUnionUnitCommandHandler(context);
        var command = new CreateUnionUnitCommand
        {
            TenDonVi = "CĐBP Ngoại con",
            LoaiToChuc = LoaiToChuc.CDBP,
            MaParent = cdbp1.Id
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateUnionUnit_ChildUnderTcd_ShouldThrowException()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        await SeedRootCdcs(context);
        var root = await context.DonViCongDoans.FirstAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS);

        var tcd = new DonViCongDoan
        {
            TenDonVi = "Tổ công đoàn trực thuộc",
            LoaiToChuc = LoaiToChuc.TO_CD_TRUC_THUOC_CDCS,
            Level = 2,
            MaParent = root.Id,
            TrangThai = 1
        };
        context.DonViCongDoans.Add(tcd);
        await context.SaveChangesAsync();

        var handler = new CreateUnionUnitCommandHandler(context);
        var command = new CreateUnionUnitCommand
        {
            TenDonVi = "Tổ con cấp 4",
            LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
            MaParent = tcd.Id
        };

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task CreateUnionUnit_SuccessScenarios_ShouldAddSuccessfully()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        await SeedRootCdcs(context);
        var root = await context.DonViCongDoans.FirstAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS);
        var handler = new CreateUnionUnitCommandHandler(context);

        // 1. Tạo CĐBP dưới CĐCS thành công
        var cdbpId = await handler.Handle(new CreateUnionUnitCommand
        {
            TenDonVi = "CĐBP Khối Nội 1",
            LoaiToChuc = LoaiToChuc.CDBP,
            MaParent = root.Id
        }, CancellationToken.None);

        // 2. Tạo tổ thuộc CĐBP thành công
        var tcdCdbpId = await handler.Handle(new CreateUnionUnitCommand
        {
            TenDonVi = "Tổ Tiêu hóa",
            LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP,
            MaParent = cdbpId
        }, CancellationToken.None);

        // 3. Tạo tổ trực thuộc CĐCS thành công
        var tcdCdcsId = await handler.Handle(new CreateUnionUnitCommand
        {
            TenDonVi = "Tổ trực thuộc CĐCS số 1",
            LoaiToChuc = LoaiToChuc.TO_CD_TRUC_THUOC_CDCS,
            MaParent = root.Id
        }, CancellationToken.None);

        // Assert
        Assert.NotEqual(Guid.Empty, cdbpId);
        Assert.NotEqual(Guid.Empty, tcdCdbpId);
        Assert.NotEqual(Guid.Empty, tcdCdcsId);

        var units = await context.DonViCongDoans.ToListAsync();
        Assert.Equal(4, units.Count);
    }

    [Fact]
    public async Task TransferUnionMember_ShouldUpdateMemberCountsCorrectly()
    {
        // Arrange
        var context = GetInMemoryDbContext();
        await SeedRootCdcs(context);
        var root = await context.DonViCongDoans.FirstAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS);

        var cdbp = new DonViCongDoan { TenDonVi = "CĐBP 1", LoaiToChuc = LoaiToChuc.CDBP, Level = 2, MaParent = root.Id };
        context.DonViCongDoans.Add(cdbp);
        await context.SaveChangesAsync();

        var tcdA = new DonViCongDoan { TenDonVi = "Tổ A", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP, Level = 3, MaParent = cdbp.Id };
        var tcdB = new DonViCongDoan { TenDonVi = "Tổ B", LoaiToChuc = LoaiToChuc.TO_CD_THUOC_CDBP, Level = 3, MaParent = cdbp.Id };
        context.DonViCongDoans.AddRange(tcdA, tcdB);
        await context.SaveChangesAsync();

        // Thêm đoàn viên vào Tổ A
        var member = new DoanVien
        {
            HoTen = "Nguyễn Văn A",
            SoCCCD = "123456789012",
            MaNhanVien = "NV-0001",
            MaToCongDoan = tcdA.Id,
            NgayVaoCongDoan = DateTime.Today,
            VaiTro = VaiTroCongDoan.DoanVien,
            TrangThai = TrangThaiDoanVien.DangSinhHoat
        };
        context.DoanViens.Add(member);
        await context.SaveChangesAsync();

        // Lấy cây thư mục trước khi chuyển để kiểm tra số liệu
        var treeQueryHandler = new GetUnionUnitsTreeQueryHandler(context, new DummyCurrentUserService());
        var treeBefore = await treeQueryHandler.Handle(new GetUnionUnitsTreeQuery(), CancellationToken.None);

        Assert.NotNull(treeBefore);
        Assert.Equal(1, treeBefore.SoDoanVien); // CĐCS có 1 đoàn viên
        var cdbpBefore = treeBefore.Children.First(c => c.Id == cdbp.Id);
        Assert.Equal(1, cdbpBefore.SoDoanVien); // CĐBP 1 có 1 đoàn viên
        Assert.Equal(1, cdbpBefore.Children.First(c => c.Id == tcdA.Id).SoDoanVien); // Tổ A có 1 đoàn viên
        Assert.Equal(0, cdbpBefore.Children.First(c => c.Id == tcdB.Id).SoDoanVien); // Tổ B có 0 đoàn viên

        // Act - Chuyển sang Tổ B
        var transferHandler = new TransferUnionMemberCommandHandler(context, new DummyOrganizationScopeService(), new DummyCurrentUserService());
        var result = await transferHandler.Handle(new TransferUnionMemberCommand
        {
            DoanVienId = member.Id,
            DenToCongDoanId = tcdB.Id,
            LyDo = "Thử nghiệm điều động",
            NgayHieuLuc = DateTime.Today
        }, CancellationToken.None);

        // Lấy cây thư mục sau khi chuyển
        var treeAfter = await treeQueryHandler.Handle(new GetUnionUnitsTreeQuery(), CancellationToken.None);

        // Assert
        Assert.True(result);
        Assert.NotNull(treeAfter);
        Assert.Equal(1, treeAfter.SoDoanVien); // Tổng số đoàn viên CĐCS vẫn là 1
        var cdbpAfter = treeAfter.Children.First(c => c.Id == cdbp.Id);
        Assert.Equal(1, cdbpAfter.SoDoanVien); // CĐBP 1 vẫn là 1
        Assert.Equal(0, cdbpAfter.Children.First(c => c.Id == tcdA.Id).SoDoanVien); // Tổ A giảm về 0
        Assert.Equal(1, cdbpAfter.Children.First(c => c.Id == tcdB.Id).SoDoanVien); // Tổ B tăng lên 1
    }

    private class DummyCurrentUserService : QLCD.Application.Common.Interfaces.ICurrentUserService
    {
        public Guid? UserId => Guid.Empty;
        public string? Username => "admin";
        public string? Role => "ADMIN";
        public Guid? OrganizationId => null;
        public bool IsAdmin => true;
        public bool IsCdcs => false;
        public bool IsCdbp => false;
        public bool IsTocd => false;
    }

    private class DummyOrganizationScopeService : QLCD.Application.Common.Interfaces.IOrganizationScopeService
    {
        public Task<System.Collections.Generic.List<Guid>?> GetAllowedOrganizationIdsAsync(CancellationToken cancellationToken = default)
        {
            return Task.FromResult<System.Collections.Generic.List<Guid>?>(null);
        }

        public Task<bool> IsInScopeAsync(Guid targetOrgId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }

        public Task<bool> IsMemberInScopeAsync(Guid memberId, CancellationToken cancellationToken = default)
        {
            return Task.FromResult(true);
        }
    }
}
