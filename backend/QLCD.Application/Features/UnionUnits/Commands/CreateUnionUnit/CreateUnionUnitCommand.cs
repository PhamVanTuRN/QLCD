using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using QLCD.Application.Common.Interfaces;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;

public record CreateUnionUnitCommand : IRequest<Guid>
{
    public required string TenDonVi { get; init; }
    public LoaiToChuc LoaiToChuc { get; init; }
    public Guid? MaParent { get; init; }
    public Guid? MaKhoi { get; init; }
}

public class CreateUnionUnitCommandHandler : IRequestHandler<CreateUnionUnitCommand, Guid>
{
    private readonly IQLCDDbContext _context;

    public CreateUnionUnitCommandHandler(IQLCDDbContext context)
    {
        _context = context;
    }

    public async Task<Guid> Handle(CreateUnionUnitCommand request, CancellationToken cancellationToken)
    {
        // 1. Kiểm tra ràng buộc chỉ có duy nhất 01 CĐCS
        if (request.LoaiToChuc == LoaiToChuc.CDCS)
        {
            var existsCdcs = await _context.DonViCongDoans
                .AnyAsync(u => u.LoaiToChuc == LoaiToChuc.CDCS, cancellationToken);
            if (existsCdcs)
            {
                throw new ArgumentException("Hệ thống chỉ được phép tồn tại duy nhất 01 Công đoàn Cơ sở.");
            }
        }

        int computedLevel = 1;
        
        // 2. Kiểm tra ràng buộc quan hệ cha-con
        if (request.MaParent.HasValue)
        {
            var parent = await _context.DonViCongDoans
                .FirstOrDefaultAsync(u => u.Id == request.MaParent.Value, cancellationToken);
            if (parent == null)
            {
                throw new ArgumentException("Đơn vị cha không tồn tại.");
            }

            // Chặn tạo con dưới Tổ công đoàn (Level 3 hoặc Tổ trực thuộc)
            if (parent.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP || parent.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS)
            {
                throw new ArgumentException("Không được phép tạo đơn vị con dưới cấp Tổ công đoàn (Level 3/Nút lá).");
            }

            // Quy tắc CĐCS làm cha
            if (parent.LoaiToChuc == LoaiToChuc.CDCS)
            {
                if (request.LoaiToChuc != LoaiToChuc.CDBP && request.LoaiToChuc != LoaiToChuc.TO_CD_TRUC_THUOC_CDCS)
                {
                    throw new ArgumentException("Đơn vị trực thuộc Công đoàn Cơ sở phải là Công đoàn Bộ phận hoặc Tổ công đoàn trực thuộc.");
                }
                computedLevel = 2;
            }

            // Quy tắc CDBP làm cha
            if (parent.LoaiToChuc == LoaiToChuc.CDBP)
            {
                if (request.LoaiToChuc != LoaiToChuc.TO_CD_THUOC_CDBP)
                {
                    throw new ArgumentException("Đơn vị con dưới Công đoàn Bộ phận chỉ được phép là Tổ công đoàn thuộc CĐBP.");
                }
                computedLevel = 3;
            }
        }
        else
        {
            // Nếu không chọn parent, bắt buộc phải là CDCS
            if (request.LoaiToChuc != LoaiToChuc.CDCS)
            {
                throw new ArgumentException("Các đơn vị cấp dưới bắt buộc phải có đơn vị cha chỉ định.");
            }
            computedLevel = 1;
        }

        var newUnit = new DonViCongDoan
        {
            TenDonVi = request.TenDonVi,
            LoaiToChuc = request.LoaiToChuc,
            Level = computedLevel,
            MaParent = request.MaParent,
            MaKhoi = request.MaKhoi,
            TrangThai = 1
        };

        _context.DonViCongDoans.Add(newUnit);
        await _context.SaveChangesAsync(cancellationToken);

        // Tự động tạo tài khoản quản lý cho đơn vị mới
        var baseName = ToUnaccentedLowercase(request.TenDonVi);
        baseName = baseName.Replace("cong_doan_co_so_", "")
                           .Replace("cong_doan_bo_phan_", "")
                           .Replace("to_cong_doan_", "")
                           .Replace("cong_doan_", "")
                           .Replace("to_cd_", "");

        string prefix = request.LoaiToChuc switch
        {
            LoaiToChuc.CDCS => "cdcs_",
            LoaiToChuc.CDBP => "cdbp_",
            _ => "tocd_"
        };

        string username = prefix + baseName;
        int suffix = 1;
        string finalUsername = username;
        while (await _context.TaiKhoans.AnyAsync(a => a.Username == finalUsername, cancellationToken))
        {
            finalUsername = $"{username}_{suffix}";
            suffix++;
        }

        string tempPassword = "123456aA@";

        string role = request.LoaiToChuc switch
        {
            LoaiToChuc.CDCS => "CDCS",
            LoaiToChuc.CDBP => "CDBP",
            _ => "TOCD"
        };

        var newAccount = new TaiKhoan
        {
            Username = finalUsername,
            PasswordHash = QLCD.Shared.Security.PasswordHasher.Hash(tempPassword),
            HoTen = $"Quản lý {request.TenDonVi}",
            VaiTro = role,
            OrganizationId = newUnit.Id,
            PasswordRaw = tempPassword,
            TrangThai = true
        };

        _context.TaiKhoans.Add(newAccount);
        await _context.SaveChangesAsync(cancellationToken);

        return newUnit.Id;
    }

    private static string ToUnaccentedLowercase(string text)
    {
        if (string.IsNullOrEmpty(text)) return string.Empty;
        string[] arr1 = new string[] { "á", "à", "ả", "ã", "ạ", "â", "ấ", "ầ", "ẩ", "ẫ", "ậ", "ă", "ắ", "ằ", "ẳ", "ẵ", "ặ",
            "đ",
            "é", "è", "ẻ", "ẽ", "ẹ", "ê", "ế", "ề", "ể", "ễ", "ệ",
            "í", "ì", "ỉ", "ĩ", "ị",
            "ó", "ò", "ỏ", "õ", "ọ", "ô", "ố", "ồ", "ổ", "ỗ", "ộ", "ơ", "ớ", "ờ", "ở", "ỡ", "ợ",
            "ú", "ù", "ủ", "ũ", "ụ", "ư", "ứ", "ừ", "ử", "ữ", "ự",
            "ý", "ỳ", "ỷ", "ỹ", "ỵ" };
        string[] arr2 = new string[] { "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a", "a",
            "d",
            "e", "e", "e", "e", "e", "e", "e", "e", "e", "e", "e",
            "i", "i", "i", "i", "i",
            "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o", "o",
            "u", "u", "u", "u", "u", "u", "u", "u", "u", "u", "u",
            "y", "y", "y", "y", "y" };
        string result = text.ToLower();
        for (int i = 0; i < arr1.Length; i++)
        {
            result = result.Replace(arr1[i], arr2[i]);
        }
        
        var sb = new System.Text.StringBuilder();
        foreach (char c in result)
        {
            if (char.IsLetterOrDigit(c) || c == '_')
                sb.Append(c);
            else if (c == ' ' || c == '-')
                sb.Append('_');
        }
        return sb.ToString().Replace("___", "_").Replace("__", "_").Trim('_');
    }
}
