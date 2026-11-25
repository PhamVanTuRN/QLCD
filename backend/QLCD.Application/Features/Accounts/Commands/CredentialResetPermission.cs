using QLCD.Domain.Security;

namespace QLCD.Application.Features.Accounts.Commands;

public sealed record CredentialResetPermission(Guid? AccountId)
{
    public const string Policy = "ResetAccountCredentials";
    public const string AdminUsername = "qlcd_admin";

    public bool Allows(Guid? id, string? username, string? role) =>
        AccountId.HasValue && id == AccountId && username == AdminUsername && role == SecurityRoles.Admin;
}
