using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using AttendanceManagement.Domain.Entities;
using AttendanceManagement.Shared.Security;

namespace AttendanceManagement.Infrastructure.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AttendanceDbContext context)
    {
        // 1. Seed Danh má»¥c dÃ¹ng chung (table DanhMucDungChungs)
        if (!await context.DanhMucDungChungs.AnyAsync())
        {
            var catalogs = new List<DanhMucDungChung>
            {
                new() { Loai = "LocationType", Ma = "HALL", Ten = "Há»™i trÆ°á»ng", ThuTu = 1 },
                new() { Loai = "LocationType", Ma = "MEETING_ROOM", Ten = "PhÃ²ng há»p", ThuTu = 2 },
                new() { Loai = "LocationType", Ma = "CLASSROOM", Ten = "PhÃ²ng há»c", ThuTu = 3 },
                
                new() { Loai = "DeviceType", Ma = "CAMERA", Ten = "Camera AI", ThuTu = 1 },
                new() { Loai = "DeviceType", Ma = "CARD_READER", Ten = "Máy quẹt thẻ", ThuTu = 2 }
            };
            context.DanhMucDungChungs.AddRange(catalogs);
            await context.SaveChangesAsync();
        }

        // 2. Seed system accounts
        var adminUser = await context.UserAccounts.FirstOrDefaultAsync(x => x.Username == "admin");
        if (adminUser == null)
        {
            adminUser = new UserAccount
            {
                Username = "admin",
                PasswordHash = PasswordHasher.Hash("admin123"),
                FullName = "Quản trị viên Hệ thống",
                Role = "ADMIN",
                Status = true
            };
            context.UserAccounts.Add(adminUser);
        }
        else
        {
            adminUser.Role = "ADMIN";
        }

        var managerUser = await context.UserAccounts.FirstOrDefaultAsync(x => x.Username == "manager" || x.Username == "qldd_admin" || x.Username == "cdcs_benhvien");
        if (managerUser == null)
        {
            managerUser = new UserAccount
            {
                Username = "manager",
                PasswordHash = PasswordHasher.Hash("admin123"),
                FullName = "Quản lý sự kiện",
                Role = "EVENT_MANAGER",
                Status = true
            };
            context.UserAccounts.Add(managerUser);
        }
        else
        {
            managerUser.Username = "manager";
            managerUser.Role = "EVENT_MANAGER";
            managerUser.FullName = "Quản lý sự kiện";
        }

        await context.SaveChangesAsync();
    }
}
