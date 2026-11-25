using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class HardenAuthenticationAndEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PasswordRaw",
                table: "TaiKhoans");

            migrationBuilder.AddColumn<long>(
                name: "LastMfaStep",
                table: "TaiKhoans",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MustChangePassword",
                table: "TaiKhoans",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "TemporaryPasswordExpiresUtc",
                table: "TaiKhoans",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProtectedMfaSecret",
                table: "TaiKhoans",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SecurityVersion",
                table: "TaiKhoans",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<bool>(
                name: "ContentValidated",
                table: "EvidenceFiles",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CorrelationId",
                table: "AuditLogs",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            // All previously issued credentials used the retired password and session formats.
            // Defer name resolution until the migration guard runs and the new columns exist.
            migrationBuilder.Sql("""
                EXEC(N'UPDATE [TaiKhoans]
                SET [PasswordHash] = N'''', [MustChangePassword] = 1, [TrangThai] = 0, [SecurityVersion] = NEWID();');
                EXEC(N'UPDATE [AuditLogs] SET [OldValues] = NULL, [NewValues] = NULL
                WHERE [OldValues] IS NOT NULL OR [NewValues] IS NOT NULL;');
                """);

            migrationBuilder.CreateTable(
                name: "AuthSessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AccountId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SecurityVersion = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TokenHash = table.Column<string>(type: "varchar(64)", unicode: false, maxLength: 64, nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuthSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuthSessions_TaiKhoans_AccountId",
                        column: x => x.AccountId,
                        principalTable: "TaiKhoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceFiles_ModuleName_RelatedEntityId",
                table: "EvidenceFiles",
                columns: new[] { "ModuleName", "RelatedEntityId" });

            migrationBuilder.CreateIndex(
                name: "IX_EvidenceFiles_OrganizationId",
                table: "EvidenceFiles",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditLogs_Timestamp",
                table: "AuditLogs",
                column: "Timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_AccountId",
                table: "AuthSessions",
                column: "AccountId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_ExpiresAtUtc",
                table: "AuthSessions",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_AuthSessions_TokenHash",
                table: "AuthSessions",
                column: "TokenHash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder) =>
            throw new NotSupportedException("Credential cleanup requires a forward-compatible deployment.");
    }
}
