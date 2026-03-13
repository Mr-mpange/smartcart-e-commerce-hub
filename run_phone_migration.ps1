# PowerShell script to run phone number migration
$connectionString = "postgresql://postgres.qpojzblbodlphwzfpxbi:Kilindo@2024@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

Write-Host "Running phone number migration..." -ForegroundColor Yellow

# Read the SQL file
$sqlContent = Get-Content "fix_phone_numbers.sql" -Raw

# Execute using psql if available, otherwise show instructions
try {
    if (Get-Command psql -ErrorAction SilentlyContinue) {
        Write-Host "Executing SQL migration..." -ForegroundColor Green
        $sqlContent | psql $connectionString
        Write-Host "Migration completed!" -ForegroundColor Green
    } else {
        Write-Host "psql not found. Please run this SQL manually in your database:" -ForegroundColor Red
        Write-Host $sqlContent -ForegroundColor Cyan
    }
} catch {
    Write-Host "Error executing migration: $_" -ForegroundColor Red
    Write-Host "Please run this SQL manually in your database:" -ForegroundColor Yellow
    Write-Host $sqlContent -ForegroundColor Cyan
}