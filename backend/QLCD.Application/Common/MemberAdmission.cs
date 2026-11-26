using System.Linq;
using Microsoft.EntityFrameworkCore;
using QLCD.Domain.Entities;
using QLCD.Domain.Enums;

namespace QLCD.Application.Common;

internal static class MemberAdmission
{
    public static IQueryable<DonViCongDoan> EligibleUnits(this IQueryable<DonViCongDoan> units) =>
        units.OperationalUnits().Where(unit => unit.TrangThai == 1 && (
            unit.LoaiToChuc == LoaiToChuc.TO_CD_TRUC_THUOC_CDCS
            || unit.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP
            || (unit.LoaiToChuc == LoaiToChuc.CDBP && !units.IgnoreQueryFilters().Any(child =>
                child.MaParent == unit.Id && child.LoaiToChuc == LoaiToChuc.TO_CD_THUOC_CDBP))));
}
