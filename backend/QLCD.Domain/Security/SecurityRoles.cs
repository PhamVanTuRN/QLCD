namespace QLCD.Domain.Security;

public static class SecurityRoles
{
    public const string Admin = "ADMIN";
    public const string Central = "CDCS";
    public const string Department = "CDBP";
    public const string Team = "TOCD";

    public const string Staff = Admin + "," + Central + "," + Department + "," + Team;
    public const string UnitManagers = Admin + "," + Central;
    public const string TransferManagers = UnitManagers + "," + Department;
    public const string Business = Central + "," + Department + "," + Team;
    public const string Finance = Central + "," + Department;

    public static bool IsStaff(string? role) => role is Admin or Central or Department or Team;
}
