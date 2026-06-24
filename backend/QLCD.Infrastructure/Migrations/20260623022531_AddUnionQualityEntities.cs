using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QLCD.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUnionQualityEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "QualityCriterias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Ma = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Ten = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PhanLoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MucTieu = table.Column<double>(type: "float", nullable: false),
                    DonViTinh = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsInverse = table.Column<bool>(type: "bit", nullable: false),
                    ThuTu = table.Column<int>(type: "int", nullable: false),
                    TrangThai = table.Column<bool>(type: "bit", nullable: false),
                    MoTa = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AutoCalculationKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityCriterias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QualityEvaluationPeriods",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Nam = table.Column<int>(type: "int", nullable: false),
                    Ky = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TenKy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TrangThai = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityEvaluationPeriods", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QualityEvaluations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViCongDoanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QualityEvaluationPeriodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TongDiem = table.Column<double>(type: "float", nullable: false),
                    XepLoai = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DatSoTieuChi = table.Column<int>(type: "int", nullable: false),
                    TongSoTieuChi = table.Column<int>(type: "int", nullable: false),
                    NguoiDanhGia = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NgayDanhGia = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityEvaluations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QualityEvaluations_DonViCongDoans_DonViCongDoanId",
                        column: x => x.DonViCongDoanId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QualityEvaluations_QualityEvaluationPeriods_QualityEvaluationPeriodId",
                        column: x => x.QualityEvaluationPeriodId,
                        principalTable: "QualityEvaluationPeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QualityManualInputs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DonViCongDoanId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QualityEvaluationPeriodId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QualityCriteriaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GiaTri = table.Column<double>(type: "float", nullable: false),
                    NgayCapNhat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    NguoiCapNhat = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityManualInputs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QualityManualInputs_DonViCongDoans_DonViCongDoanId",
                        column: x => x.DonViCongDoanId,
                        principalTable: "DonViCongDoans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QualityManualInputs_QualityCriterias_QualityCriteriaId",
                        column: x => x.QualityCriteriaId,
                        principalTable: "QualityCriterias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QualityManualInputs_QualityEvaluationPeriods_QualityEvaluationPeriodId",
                        column: x => x.QualityEvaluationPeriodId,
                        principalTable: "QualityEvaluationPeriods",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QualityEvaluationDetails",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QualityEvaluationId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    QualityCriteriaId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    MucTieu = table.Column<double>(type: "float", nullable: false),
                    ThucTe = table.Column<double>(type: "float", nullable: false),
                    IsPassed = table.Column<bool>(type: "bit", nullable: false),
                    DiemSo = table.Column<double>(type: "float", nullable: false),
                    FileMinhChungUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GhiChu = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityEvaluationDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QualityEvaluationDetails_QualityCriterias_QualityCriteriaId",
                        column: x => x.QualityCriteriaId,
                        principalTable: "QualityCriterias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QualityEvaluationDetails_QualityEvaluations_QualityEvaluationId",
                        column: x => x.QualityEvaluationId,
                        principalTable: "QualityEvaluations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QualityEvaluationDetails_QualityCriteriaId",
                table: "QualityEvaluationDetails",
                column: "QualityCriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityEvaluationDetails_QualityEvaluationId",
                table: "QualityEvaluationDetails",
                column: "QualityEvaluationId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityEvaluations_DonViCongDoanId",
                table: "QualityEvaluations",
                column: "DonViCongDoanId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityEvaluations_QualityEvaluationPeriodId",
                table: "QualityEvaluations",
                column: "QualityEvaluationPeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityManualInputs_DonViCongDoanId",
                table: "QualityManualInputs",
                column: "DonViCongDoanId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityManualInputs_QualityCriteriaId",
                table: "QualityManualInputs",
                column: "QualityCriteriaId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityManualInputs_QualityEvaluationPeriodId",
                table: "QualityManualInputs",
                column: "QualityEvaluationPeriodId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QualityEvaluationDetails");

            migrationBuilder.DropTable(
                name: "QualityManualInputs");

            migrationBuilder.DropTable(
                name: "QualityEvaluations");

            migrationBuilder.DropTable(
                name: "QualityCriterias");

            migrationBuilder.DropTable(
                name: "QualityEvaluationPeriods");
        }
    }
}
