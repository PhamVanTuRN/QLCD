using System;
using FluentValidation;

namespace QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;

public class CreateUnionMemberCommandValidator : AbstractValidator<CreateUnionMemberCommand>
{
    public CreateUnionMemberCommandValidator()
    {
        RuleFor(v => v.HoTen)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(100).WithMessage("Họ tên không được quá 100 ký tự.");

        RuleFor(v => v.SoCCCD)
            .NotEmpty().WithMessage("Số CCCD/CMTQĐ không được để trống.")
            .Length(9, 12).WithMessage("Số CCCD/CMTQĐ phải từ 9 đến 12 số.");

        RuleFor(v => v.MaNhanVien)
            .NotEmpty().WithMessage("Mã nhân viên không được để trống.");

        RuleFor(v => v.NgayVaoCongDoan)
            .LessThanOrEqualTo(DateTime.Today).WithMessage("Ngày vào Công đoàn không được lớn hơn ngày hiện tại.");

        RuleFor(v => v.Email)
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.")
            .When(v => !string.IsNullOrEmpty(v.Email));

        RuleFor(v => v.DienThoai)
            .Matches(@"^\+?[0-9]{9,15}$").WithMessage("Số điện thoại không đúng định dạng.")
            .When(v => !string.IsNullOrEmpty(v.DienThoai));
    }
}
