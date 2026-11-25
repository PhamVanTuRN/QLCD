using System;
using FluentValidation;

namespace QLCD.Application.Features.UnionMembers.Commands.CreateUnionMember;

public class CreateUnionMemberCommandValidator : AbstractValidator<CreateUnionMemberCommand>
{
    public CreateUnionMemberCommandValidator(TimeProvider clock)
    {
        var vietnamOffset = TimeSpan.FromHours(7);

        RuleFor(v => v.HoTen)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(100).WithMessage("Họ tên không được quá 100 ký tự.");

        RuleFor(v => v.SoCCCD)
            .NotEmpty().WithMessage("Số CCCD/CMTQĐ không được để trống.")
            .Matches(@"^[0-9]{9,12}$").WithMessage("Số CCCD/CMTQĐ phải từ 9 đến 12 chữ số.");

        RuleFor(v => v.MaNhanVien)
            .NotEmpty().WithMessage("Mã nhân viên không được để trống.")
            .MaximumLength(20).WithMessage("Mã nhân viên không được quá 20 ký tự.");

        RuleFor(v => v.MaToCongDoan)
            .NotEmpty().WithMessage("Chọn đơn vị tiếp nhận đoàn viên.");

        RuleFor(v => v.NgaySinh)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Nhập ngày sinh.")
            .Must((member, birthDate) => birthDate.Year <= 9981 &&
                member.NgayVaoCongDoan.Date >= birthDate.Date.AddYears(18))
            .WithMessage("Đoàn viên phải đủ 18 tuổi vào ngày vào công đoàn.")
            .When(v => v.NgayVaoCongDoan != default, ApplyConditionTo.CurrentValidator);

        RuleFor(v => v.NgayVaoCongDoan)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Nhập ngày vào công đoàn.")
            .Must(date => date.Date <= clock.GetUtcNow().ToOffset(vietnamOffset).Date)
            .WithMessage("Ngày vào Công đoàn không được lớn hơn ngày hiện tại.");

        RuleFor(v => v.LoaiCanBo)
            .IsInEnum().WithMessage("Loại cán bộ không hợp lệ.");

        RuleFor(v => v.Email)
            .EmailAddress().WithMessage("Địa chỉ email không đúng định dạng.")
            .When(v => !string.IsNullOrEmpty(v.Email));

        RuleFor(v => v.DienThoai)
            .Matches(@"^\+?[0-9]{9,15}$").WithMessage("Số điện thoại không đúng định dạng.")
            .When(v => !string.IsNullOrEmpty(v.DienThoai));

        RuleForEach(v => v.NgoaiNgus)
            .NotNull().WithMessage("Thông tin chứng chỉ ngoại ngữ không hợp lệ.")
            .ChildRules(certificate =>
            {
                certificate.RuleFor(v => v.NgoaiNgu).NotEmpty().MaximumLength(100)
                    .WithMessage("Tên ngoại ngữ phải có từ 1 đến 100 ký tự.");
                certificate.RuleFor(v => v.TrinhDo).NotEmpty().MaximumLength(50)
                    .WithMessage("Trình độ ngoại ngữ phải có từ 1 đến 50 ký tự.");
                certificate.RuleFor(v => v.NgayCap)
                    .Must(date => date != default && date.Date <= clock.GetUtcNow().ToOffset(vietnamOffset).Date)
                    .WithMessage("Nhập ngày cấp chứng chỉ hợp lệ và không lớn hơn ngày hiện tại.");
                certificate.RuleFor(v => v.DiemSo).GreaterThanOrEqualTo(0)
                    .WithMessage("Điểm ngoại ngữ không được âm.");
            });
    }
}
