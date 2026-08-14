using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SchoolManagement.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteAndUniqueConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Submissions_AssignmentId",
                table: "Submissions");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_Code",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_ClassSubjectTeachers_ClassId",
                table: "ClassSubjectTeachers");

            migrationBuilder.DropIndex(
                name: "IX_ClassStudents_ClassId",
                table: "ClassStudents");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Submissions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Submissions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Subjects",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Subjects",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Classes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Classes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Assignments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Assignments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_AssignmentId_StudentId",
                table: "Submissions",
                columns: new[] { "AssignmentId", "StudentId" },
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_Code",
                table: "Subjects",
                column: "Code",
                unique: true,
                filter: "\"IsDeleted\" = false");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSubjectTeachers_ClassId_SubjectId_TeacherId",
                table: "ClassSubjectTeachers",
                columns: new[] { "ClassId", "SubjectId", "TeacherId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassStudents_ClassId_StudentId",
                table: "ClassStudents",
                columns: new[] { "ClassId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Classes_Name_GradeLevel",
                table: "Classes",
                columns: new[] { "Name", "GradeLevel" },
                unique: true,
                filter: "\"IsDeleted\" = false");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Submissions_AssignmentId_StudentId",
                table: "Submissions");

            migrationBuilder.DropIndex(
                name: "IX_Subjects_Code",
                table: "Subjects");

            migrationBuilder.DropIndex(
                name: "IX_ClassSubjectTeachers_ClassId_SubjectId_TeacherId",
                table: "ClassSubjectTeachers");

            migrationBuilder.DropIndex(
                name: "IX_ClassStudents_ClassId_StudentId",
                table: "ClassStudents");

            migrationBuilder.DropIndex(
                name: "IX_Classes_Name_GradeLevel",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Submissions");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Subjects");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Classes");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Assignments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Assignments");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Submissions_AssignmentId",
                table: "Submissions",
                column: "AssignmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_Code",
                table: "Subjects",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSubjectTeachers_ClassId",
                table: "ClassSubjectTeachers",
                column: "ClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassStudents_ClassId",
                table: "ClassStudents",
                column: "ClassId");
        }
    }
}
