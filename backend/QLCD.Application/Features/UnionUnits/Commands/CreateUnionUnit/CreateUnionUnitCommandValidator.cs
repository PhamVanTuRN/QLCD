using FluentValidation;

namespace QLCD.Application.Features.UnionUnits.Commands.CreateUnionUnit;

public class CreateUnionUnitCommandValidator : AbstractValidator<CreateUnionUnitCommand>
{
    public CreateUnionUnitCommandValidator()
    {
        RuleFor(v => v.TenDonVi)
            .NotEmpty().WithMessage("Tên đơn vị không được để trống.")
            .MaximumLength(150).WithMessage("Tên đơn vị không được vượt quá 150 ký tự.");

        RuleFor(v => v.LoaiToChuc)
            .IsInEnum().WithMessage("Loại tổ chức không hợp lệ.");
    }
}
