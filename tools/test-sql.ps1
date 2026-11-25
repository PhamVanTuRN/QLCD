param(
    [ValidatePattern('^(\.|localhost|127\.0\.0\.1)(\\[A-Za-z0-9_]+)?$')]
    [string]$Server = '.\SQLEXPRESS',
    [string]$TestsDll,
    [switch]$RehearseRestore
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runId = [Guid]::NewGuid().ToString('N')
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) "qlcd-sql-$runId"
$connectionBefore = $env:QLCD_TEST_SQL_CONNECTION
$backup = $null
$backupDirectory = $null

function Run-Sql {
    param([string]$Database, [string[]]$SqlArgs)
    & sqlcmd -S $Server -E -C -b -d $Database @SqlArgs
    if ($LASTEXITCODE -ne 0) { throw "SQL smoke failed on $Database" }
}

function New-MigrationScript {
    param([string]$Target, [string]$Output)
    & dotnet ef migrations script 0 $Target --idempotent --project backend/QLCD.Infrastructure --startup-project backend/QLCD.Api --no-build --output $Output
    if ($LASTEXITCODE -ne 0) { throw "Unable to generate migration script" }
}

New-Item -ItemType Directory -Path $tmp | Out-Null
Push-Location -LiteralPath $repo
$created = @()
try {
    $upgrade = "QLCD_Test_Upgrade_$runId"
    $clean = "QLCD_Test_Clean_$runId"
    $previous = Join-Path $tmp 'previous.sql'
    $hardened = Join-Path $tmp 'hardened.sql'
    $authenticator = Join-Path $tmp 'authenticator.sql'
    $current = Join-Path $tmp 'current.sql'
    New-MigrationScript '20260621222853_AddEvidenceFiles' $previous
    New-MigrationScript 'HardenAuthenticationAndEvidence' $hardened
    New-MigrationScript 'RequireAuthenticatorActivation' $authenticator
    New-MigrationScript 'SeparateActivationExpiry' $current
    foreach ($database in @($upgrade, $clean)) {
        Run-Sql 'master' @('-Q', "CREATE DATABASE [$database];")
        $created += $database
    }

    Run-Sql $upgrade @('-i', $previous)
    Run-Sql $upgrade @('-Q', @'
INSERT dbo.TaiKhoans (Id, Username, PasswordHash, HoTen, VaiTro, PasswordRaw, TrangThai, CreatedDate, IsDeleted)
VALUES (NEWID(), N'fixture-legacy', N'legacy-fixture-hash', N'Fixture', N'ADMIN', N'synthetic', 1, SYSUTCDATETIME(), 0);
INSERT dbo.AuditLogs (Id, EntityName, RecordId, Action, OldValues, NewValues, Timestamp)
VALUES (NEWID(), N'Fixture', NEWID(), N'UPDATE', N'synthetic-before', N'synthetic-after', SYSUTCDATETIME());
'@)
    Run-Sql $upgrade @('-i', $hardened)
    Run-Sql $upgrade @('-Q', @'
IF COL_LENGTH('dbo.TaiKhoans', 'PasswordRaw') IS NOT NULL
    THROW 51000, 'Legacy password column still exists', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoans WHERE Username = N'fixture-legacy'
    AND PasswordHash = N'' AND MustChangePassword = 1 AND TrangThai = 0
    AND SecurityVersion <> '00000000-0000-0000-0000-000000000000')
    THROW 51000, 'Legacy credentials were not invalidated', 1;
IF EXISTS (SELECT 1 FROM dbo.AuditLogs WHERE OldValues IS NOT NULL OR NewValues IS NOT NULL)
    THROW 51000, 'Legacy audit values remain', 1;
UPDATE dbo.TaiKhoans SET PasswordHash = N'marker-after-upgrade' WHERE Username = N'fixture-legacy';
INSERT dbo.TaiKhoans (Id, Username, PasswordHash, HoTen, VaiTro, TrangThai, CreatedDate, IsDeleted, MustChangePassword, SecurityVersion, ProtectedMfaSecret, LastMfaStep)
VALUES (NEWID(), N'fixture-existing-auth', N'fixture-existing-hash', N'Fixture', N'ADMIN', 1, SYSUTCDATETIME(), 0, 0, NEWID(), N'fixture-existing-secret', 42);
'@)
    Run-Sql $upgrade @('-i', $authenticator)
    Run-Sql $upgrade @('-Q', @'
UPDATE dbo.TaiKhoans SET ActivationCodeHash = REPLICATE('A', 64), TemporaryPasswordExpiresUtc = '2030-01-01T12:00:00'
    WHERE Username = N'fixture-legacy';
'@)
    Run-Sql $upgrade @('-i', $current)
    Run-Sql $upgrade @('-i', $current)
    Run-Sql $upgrade @('-Q', @'
IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoans WHERE Username = N'fixture-legacy' AND PasswordHash = N'marker-after-upgrade')
    THROW 51000, 'The second run changed migrated data', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoans WHERE Username = N'fixture-legacy' AND ActivationCodeHash = REPLICATE('A', 64)
    AND ActivationCodeExpiresUtc = '2030-01-01T12:00:00' AND ActivationCodeExpiresUtc = TemporaryPasswordExpiresUtc)
    THROW 51000, 'The pending activation expiry was not preserved', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.TaiKhoans WHERE Username = N'fixture-existing-auth' AND PasswordHash = N'fixture-existing-hash'
    AND ProtectedMfaSecret = N'fixture-existing-secret' AND LastMfaStep = 42 AND ActivationCodeHash IS NULL AND RecoveryCodeHashes IS NULL)
    THROW 51000, 'Required authenticator migration changed existing credentials', 1;
'@)

    Run-Sql $clean @('-i', $current)
    Run-Sql $clean @('-i', $current)
    Run-Sql $clean @('-Q', @'
IF (SELECT COUNT(*) FROM dbo.__EFMigrationsHistory) <> 5
    THROW 51000, 'Unexpected migrations in clean database', 1;
'@)
    # The loopback fixture uses the developer instance's self-signed certificate.
    $env:QLCD_TEST_SQL_CONNECTION = "Server=$Server;Database=$clean;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;"
    if ($TestsDll) {
        & dotnet test $TestsDll --filter 'FullyQualifiedName~ReportQueriesTests'
    } else {
        & dotnet test backend/QLCD.sln --no-build --no-restore --filter 'FullyQualifiedName~ReportQueriesTests'
    }
    if ($LASTEXITCODE -ne 0) { throw 'SQL report regressions failed' }
    if ($RehearseRestore) {
        $restore = "QLCD_Test_Restore_$runId"
        $serverParts = $Server -split '\\', 2
        $serviceName = if ($serverParts.Length -eq 2) { 'MSSQL$' + $serverParts[1] } else { 'MSSQLSERVER' }
        $folder = Join-Path $env:ProgramData "qlcd-sql-$runId"
        New-Item -ItemType Directory -Path $folder | Out-Null
        $backupDirectory = $folder
        & icacls $backupDirectory /grant ('NT SERVICE\{0}:(OI)(CI)M' -f $serviceName) | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Unable to grant SQL Server access to the fixture backup directory.' }
        $backup = Join-Path $backupDirectory "$clean.bak"
        $escapedBackup = $backup.Replace("'", "''")
        Run-Sql 'master' @('-Q', "BACKUP DATABASE [$clean] TO DISK = N'$escapedBackup' WITH COPY_ONLY, CHECKSUM; RESTORE VERIFYONLY FROM DISK = N'$escapedBackup' WITH CHECKSUM;")
        $created += $restore
        Run-Sql 'master' @('-Q', @"
DECLARE @data nvarchar(4000), @log nvarchar(4000), @dataName sysname, @logName sysname;
SELECT @data = REPLACE(physical_name, N'$clean', N'$restore'), @dataName = name
    FROM sys.master_files WHERE database_id = DB_ID(N'$clean') AND type = 0;
SELECT @log = REPLACE(physical_name, N'$clean', N'$restore'), @logName = name
    FROM sys.master_files WHERE database_id = DB_ID(N'$clean') AND type = 1;
IF @data IS NULL OR @log IS NULL OR CHARINDEX(N'$restore', @data) = 0 OR CHARINDEX(N'$restore', @log) = 0
    THROW 51000, 'Unable to derive isolated restore paths', 1;
DECLARE @restoreSql nvarchar(max) = N'RESTORE DATABASE [$restore] FROM DISK = @backup WITH CHECKSUM, MOVE '
    + QUOTENAME(@dataName, '''') + N' TO N''' + REPLACE(@data, '''', '''''') + N''', MOVE '
    + QUOTENAME(@logName, '''') + N' TO N''' + REPLACE(@log, '''', '''''') + N''';';
EXEC sys.sp_executesql @restoreSql, N'@backup nvarchar(4000)', N'$escapedBackup';
"@)
        Run-Sql $restore @('-Q', @'
DBCC CHECKDB WITH NO_INFOMSGS;
IF (SELECT COUNT(*) FROM dbo.__EFMigrationsHistory) <> 5
    THROW 51000, 'Restored schema history is incomplete', 1;
IF NOT EXISTS (SELECT 1 FROM dbo.DoanViens AS m INNER JOIN dbo.LichSuBienDongs AS h
    ON h.DoanVienId = m.Id AND h.DenToCongDoanId = m.MaToCongDoan WHERE m.MaNhanVien = N'REPORT826')
    THROW 51000, 'Restored member or admission history is missing', 1;
'@)
        Write-Output 'SQL backup restored into a separate fixture. Integrity, migrations and admission history verified.'
    }
    Write-Output 'SQL smoke passed on clean and legacy fixtures. No existing databases were used.'
} finally {
    $env:QLCD_TEST_SQL_CONNECTION = $connectionBefore
    try {
        foreach ($database in $created) {
            Run-Sql 'master' @('-Q', "IF DB_ID(N'$database') IS NOT NULL BEGIN ALTER DATABASE [$database] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$database]; END;")
        }
    } finally {
        Pop-Location
        foreach ($filename in @('previous.sql', 'hardened.sql', 'authenticator.sql', 'current.sql')) {
            $generated = Join-Path $tmp $filename
            if (Test-Path -LiteralPath $generated) { Remove-Item -LiteralPath $generated }
        }
        Remove-Item -LiteralPath $tmp
        if ($backup -and (Test-Path -LiteralPath $backup -PathType Leaf)) { Remove-Item -LiteralPath $backup }
        if ($backupDirectory) { Remove-Item -LiteralPath $backupDirectory }
    }
}
