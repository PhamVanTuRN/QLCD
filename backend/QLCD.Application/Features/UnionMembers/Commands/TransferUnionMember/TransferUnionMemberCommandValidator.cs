using FluentValidation;

namespace QLCD.Application.Features.UnionMembers.Commands.TransferUnionMember;

public class TransferUnionMemberCommandValidator : AbstractValidator<TransferUnionMemberCommand>
{
    public TransferUnionMemberCommandValidator()
    {
        RuleFor(v => v.DoanVienId)
            .NotEmpty().WithMessage("ID đoàn viên không được để trống.");

        RuleFor(v => v.DenToCongDoanId)
            .NotEmpty().WithMessage("ID tổ công đoàn đích không được để trống.");

        RuleFor(v => v.LyDo)
            .NotEmpty().WithMessage("Lý do chuyển sinh hoạt không được để trống.");

        RuleFor(v => v.NgayHieuLuc)
            .NotEmpty().WithMessage("Ngày hiệu lực không được để trống.");
    }
}
