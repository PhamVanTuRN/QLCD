using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RequireAuthenticatorActivation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActivationCodeHash",
                table: "TaiKhoans",
                type: "varchar(64)",
                unicode: false,
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecoveryCodeHashes",
                table: "TaiKhoans",
                type: "varchar(650)",
                unicode: false,
                maxLength: 650,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivationCodeHash",
                table: "TaiKhoans");

            migrationBuilder.DropColumn(
                name: "RecoveryCodeHashes",
                table: "TaiKhoans");
        }
    }
}
