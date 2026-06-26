using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    public partial class UpdateDangVienType : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "DangVien",
                table: "DoanViens",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "bit");

            // Chuyển đổi dữ liệu cũ từ bit (1/0) sang dạng chuỗi danh mục mới
            migrationBuilder.Sql("UPDATE DoanViens SET DangVien = N'Đảng viên chính thức' WHERE DangVien = '1' OR DangVien = 'true'");
            migrationBuilder.Sql("UPDATE DoanViens SET DangVien = N'khác' WHERE DangVien = '0' OR DangVien = 'false' OR DangVien IS NULL OR DangVien = ''");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "DangVien",
                table: "DoanViens",
                type: "bit",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
