# One-shot local Prisma + MySQL setup for the SQL/cPanel migration.
#
# What this does:
#   1. Verifies MySQL is installed and running locally
#   2. Creates a `honesty_dev` database
#   3. Writes DATABASE_URL into .env.local if missing
#   4. Generates the Prisma client
#   5. Runs `prisma db push` to create all tables
#   6. (Optional) runs the Atlas → MySQL data migration if MONGODB_URI is set
#
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts/local-setup.ps1
#
# Idempotent — safe to re-run.

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HonestY local SQL setup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# ── 1. Verify MySQL ─────────────────────────────────────────────────────
Write-Host "[1/6] Checking MySQL is installed…" -ForegroundColor Yellow
$mysql = Get-Command mysql -ErrorAction SilentlyContinue
if (-not $mysql) {
  Write-Host "  ✗ mysql command not found." -ForegroundColor Red
  Write-Host "  Install MySQL first:" -ForegroundColor Red
  Write-Host "    winget install --id Oracle.MySQL" -ForegroundColor Yellow
  Write-Host "  Then re-run this script."
  exit 1
}
$mysqlVersion = & mysql --version
Write-Host "  ✓ $mysqlVersion" -ForegroundColor Green

# ── 2. Prompt for root password if not stored ───────────────────────────
Write-Host ""
Write-Host "[2/6] Checking MySQL connection…" -ForegroundColor Yellow
$envFile = ".env.local"
$envText = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }

# Try to find an existing DATABASE_URL
$dbUrlMatch = $envText | Select-String -Pattern '^DATABASE_URL=(.+)$' -AllMatches
if ($dbUrlMatch.Matches.Count -gt 0) {
  $existing = $dbUrlMatch.Matches[0].Groups[1].Value.Trim('"', "'")
  Write-Host "  ✓ DATABASE_URL already set in .env.local" -ForegroundColor Green
  Write-Host "    $existing" -ForegroundColor DarkGray
} else {
  $rootPwd = Read-Host -Prompt "  MySQL root password (will be saved to .env.local)" -AsSecureString
  $rootPwdPlain = [System.Net.NetworkCredential]::new("", $rootPwd).Password
  $dbName = "honesty_dev"

  # Test connection
  Write-Host "  Testing connection…" -ForegroundColor DarkGray
  $env:MYSQL_PWD = $rootPwdPlain
  try {
    & mysql -u root -e "SELECT 1;" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Connection failed" }
  } catch {
    Write-Host "  ✗ Could not connect to MySQL as root. Check the password and that MySQL service is running." -ForegroundColor Red
    exit 1
  }
  Write-Host "  ✓ Connected" -ForegroundColor Green

  # Create the database
  Write-Host "  Creating database '$dbName'…" -ForegroundColor DarkGray
  & mysql -u root -e "CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  Write-Host "  ✓ Database ready" -ForegroundColor Green

  $dbUrl = "mysql://root:$rootPwdPlain@localhost:3306/$dbName"
  if ($envText -and -not $envText.EndsWith("`n")) { $envText += "`n" }
  $envText += "DATABASE_URL=$dbUrl`n"
  Set-Content -Path $envFile -Value $envText -NoNewline -Encoding UTF8
  Write-Host "  ✓ DATABASE_URL written to .env.local" -ForegroundColor Green
  $env:MYSQL_PWD = $null
}

# ── 3. Prisma generate ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Generating Prisma client…" -ForegroundColor Yellow
& npx prisma generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Prisma generate failed." -ForegroundColor Red
  exit 1
}
Write-Host "  ✓ Client generated" -ForegroundColor Green

# ── 4. Push schema to MySQL ─────────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Pushing schema to MySQL…" -ForegroundColor Yellow
& npx prisma db push --skip-generate
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ✗ Schema push failed." -ForegroundColor Red
  exit 1
}
Write-Host "  ✓ All tables created" -ForegroundColor Green

# ── 5. Optional Atlas migration ─────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Atlas data migration (optional)…" -ForegroundColor Yellow
if ($envText -match 'MONGODB_URI=([^\s]+)' -and $matches[1] -ne "") {
  Write-Host "  MONGODB_URI is set. Run the Atlas → MySQL migration now? (y/N)" -ForegroundColor Yellow
  $confirm = Read-Host
  if ($confirm -eq "y") {
    & node scripts/migrateFromAtlas.js
    if ($LASTEXITCODE -ne 0) {
      Write-Host "  ⚠ Migration script reported errors. Inspect output above." -ForegroundColor Yellow
    } else {
      Write-Host "  ✓ Atlas data migrated" -ForegroundColor Green
    }
  } else {
    Write-Host "  Skipped. Run later with:  node scripts/migrateFromAtlas.js" -ForegroundColor DarkGray
  }
} else {
  Write-Host "  MONGODB_URI not set in .env.local — skipping" -ForegroundColor DarkGray
  Write-Host "  Add it and re-run, OR migrate later with:  node scripts/migrateFromAtlas.js" -ForegroundColor DarkGray
}

# ── 6. Verify ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Running smoke test…" -ForegroundColor Yellow
& node scripts/verify-prisma.js
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ⚠ Smoke test failed. See errors above." -ForegroundColor Yellow
} else {
  Write-Host "  ✓ Smoke test passed" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Setup complete." -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next:" -ForegroundColor White
Write-Host "  npm run dev          → run locally and test in browser"
Write-Host "  npm run db:studio    → browse tables in Prisma Studio"
Write-Host "  ./scripts/build-for-cpanel.ps1   → package for cPanel deploy"
