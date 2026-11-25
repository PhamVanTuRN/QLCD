using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeparateActivationExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActivationCodeExpiresUtc",
                table: "TaiKhoans",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                EXEC(N'UPDATE dbo.TaiKhoans SET ActivationCodeExpiresUtc = TemporaryPasswordExpiresUtc
                    WHERE ActivationCodeHash IS NOT NULL;');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ActivationCodeExpiresUtc",
                table: "TaiKhoans");
        }
    }
}
