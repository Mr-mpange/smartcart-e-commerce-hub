# Final Test - Both OTP and SMS with BRIQ sender_id

Write-Host "Final Test: OTP and SMS with BRIQ sender_id" -ForegroundColor Green
Write-Host "Target: +255683859574" -ForegroundColor Yellow
Write-Host "=================================================="

$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg"
    "Content-Type" = "application/json"
}

$functionUrl = "https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms"

# Test 1: OTP
Write-Host ""
Write-Host "TEST 1: OTP Generation" -ForegroundColor Cyan
$otpBody = '{"action":"generate_otp","email":"kilindosaid771@gmail.com"}'

try {
    $response = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -Body $otpBody -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Success: $($json.success)" -ForegroundColor Green
    if ($json.briq_response.code) {
        Write-Host "OTP Code: $($json.briq_response.code)" -ForegroundColor Magenta
    }
} catch {
    Write-Host "OTP Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: SMS
Write-Host ""
Write-Host "TEST 2: Direct SMS" -ForegroundColor Cyan
$smsBody = '{"phone_number":"+255683859574","message":"Final test: Both OTP and SMS working with BRIQ sender_id!"}'

try {
    $response = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -Body $smsBody -UseBasicParsing
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Success: $($json.success)" -ForegroundColor Green
    if ($json.details.stats) {
        Write-Host "SMS Stats: $($json.details.stats.recipients) recipients, Cost: $($json.details.stats.cost)" -ForegroundColor Blue
    }
} catch {
    Write-Host "SMS Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=================================================="
Write-Host "SUMMARY:" -ForegroundColor Green
Write-Host "- OTP: Uses BRIQ sender_id via /otp/request endpoint"
Write-Host "- SMS: Uses BRIQ sender_id via /v1/message/send-instant endpoint"
Write-Host "- Both should now work and deliver to +255683859574"
Write-Host "- Admin user should have only 'admin' role (run SQL to fix)"
Write-Host "=================================================="