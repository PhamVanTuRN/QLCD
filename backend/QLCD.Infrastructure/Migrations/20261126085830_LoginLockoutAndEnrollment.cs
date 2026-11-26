using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LoginLockoutAndEnrollment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RecommendPasswordChange",
                table: "TaiKhoans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ActivationVerified",
                table: "AuthSessions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ProtectedEnrollmentKey",
                table: "AuthSessions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LoginAttempts",
                columns: table => new
                {
                    Key = table.Column<string>(type: "varchar(66)", unicode: false, maxLength: 66, nullable: false),
                    FailedLoginAttempts = table.Column<int>(type: "int", nullable: false),
                    LockoutEndUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastFailureUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoginAttempts", x => x.Key);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LoginAttempts_LastFailureUtc",
                table: "LoginAttempts",
                column: "LastFailureUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoginAttempts");

            migrationBuilder.DropColumn(
                name: "RecommendPasswordChange",
                table: "TaiKhoans");

            migrationBuilder.DropColumn(
                name: "ActivationVerified",
                table: "AuthSessions");

            migrationBuilder.DropColumn(
                name: "ProtectedEnrollmentKey",
                table: "AuthSessions");
        }
    }
}
