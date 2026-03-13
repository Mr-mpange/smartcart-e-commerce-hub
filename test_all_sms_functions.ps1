# Comprehensive SMS System Test
# Tests all SMS functionality: OTP, Direct SMS, Order Notifications, Phone Formatting

Write-Host "🚀 COMPREHENSIVE SMS SYSTEM TEST" -ForegroundColor Green
Write-Host "Testing all SMS functions with BRIQ sender_id" -ForegroundColor Yellow
Write-Host "Target Phone: +255683859574" -ForegroundColor Cyan
Write-Host "=" * 60

# Configuration
$SUPABASE_URL = "https://qpojzblbodlphwzfpxbi.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg"
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/briq-sms"

$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Test results tracking
$testResults = @{
    otpGeneration = $null
    otpVerification = $null
    directSMS = $null
    orderNotification = $null
    phoneFormatting = $null
}

# Function to run test and track results
function Test-SMSFunction {
    param(
        [string]$TestName,
        [string]$Description,
        [hashtable]$Payload,
        [string]$ResultKey
    )
    
    Write-Host ""
    Write-Host "🧪 TEST: $TestName" -ForegroundColor Cyan
    Write-Host "📝 Description: $Description" -ForegroundColor Gray
    
    $jsonPayload = $Payload | ConvertTo-Json -Compress
    Write-Host "📦 Payload: $jsonPayload" -ForegroundColor DarkGray
    
    try {
        $response = Invoke-WebRequest -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $jsonPayload -UseBasicParsing
        
        Write-Host "✅ HTTP Status: $($response.StatusCode)" -ForegroundColor Green
        
        $jsonResponse = $response.Content | ConvertFrom-Json
        
        if ($jsonResponse.success) {
            $testResults[$ResultKey] = $true
            Write-Host "🎉 SUCCESS: $($jsonResponse.message)" -ForegroundColor Green
            
            # Show specific details based on test type
            if ($jsonResponse.briq_response -and $jsonResponse.briq_response.code) {
                Write-Host "🔐 OTP Code: $($jsonResponse.briq_response.code)" -ForegroundColor Magenta
                $global:LastOTPCode = $jsonResponse.briq_response.code
            }
            
            if ($jsonResponse.details -and $jsonResponse.details.stats) {
                $stats = $jsonResponse.details.stats
                Write-Host "📊 SMS Stats: Recipients: $($stats.recipients), Parts: $($stats.sms_parts), Cost: $($stats.cost)" -ForegroundColor Blue
            }
            
            if ($jsonResponse.api_used) {
                Write-Host "🔧 API Used: $($jsonResponse.api_used)" -ForegroundColor Yellow
            }
            
        } else {
            $testResults[$ResultKey] = $false
            Write-Host "❌ FAILED: $($jsonResponse.error)" -ForegroundColor Red
            if ($jsonResponse.details) {
                Write-Host "📄 Details: $($jsonResponse.details)" -ForegroundColor Red
            }
        }
        
    } catch {
        $testResults[$ResultKey] = $false
        Write-Host "💥 ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorResponse = $reader.ReadToEnd()
                Write-Host "📄 Error Response: $errorResponse" -ForegroundColor Red
            } catch {
                Write-Host "Could not read error response" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "-" * 50
    Start-Sleep -Seconds 1
}

# TEST 1: OTP Generation
Test-SMSFunction -TestName "OTP Generation" -Description "Generate OTP for login authentication" -ResultKey "otpGeneration" -Payload @{
    action = "generate_otp"
    email = "kilindosaid771@gmail.com"
}

# TEST 2: Direct SMS
Test-SMSFunction -TestName "Direct SMS" -Description "Send direct SMS message" -ResultKey "directSMS" -Payload @{
    phone_number = "+255683859574"
    message = "🎉 SmartCart Test: Direct SMS with BRIQ sender_id working perfectly! Time: $(Get-Date -Format 'HH:mm:ss')"
}

# TEST 3: Order Notification SMS
Test-SMSFunction -TestName "Order Notification" -Description "Send order status notification" -ResultKey "orderNotification" -Payload @{
    order_id = "test-order-123"
    status = "confirmed"
    phone_number = "+255683859574"
}

# TEST 4: Phone Number Formatting Test
Test-SMSFunction -TestName "Phone Formatting" -Description "Test automatic phone number formatting" -ResultKey "phoneFormatting" -Payload @{
    phone_number = "683859574"
    message = "📱 Phone Format Test: '683859574' should auto-format to '+255683859574'"
}

# TEST 5: OTP Verification (if we got an OTP code)
if ($global:LastOTPCode) {
    Write-Host ""
    Write-Host "🔍 BONUS TEST: OTP Verification" -ForegroundColor Cyan
    Write-Host "📝 Description: Verify the OTP code we just received" -ForegroundColor Gray
    
    $verifyPayload = @{
        action = "verify_otp"
        email = "kilindosaid771@gmail.com"
        otp_code = $global:LastOTPCode
    } | ConvertTo-Json -Compress
    
    Write-Host "📦 Payload: $verifyPayload" -ForegroundColor DarkGray
    
    try {
        $response = Invoke-WebRequest -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $verifyPayload -UseBasicParsing
        $jsonResponse = $response.Content | ConvertFrom-Json
        
        if ($jsonResponse.success) {
            $testResults["otpVerification"] = $true
            Write-Host "✅ OTP Verification: SUCCESS" -ForegroundColor Green
            Write-Host "📱 Phone Verified: $($jsonResponse.phone_number)" -ForegroundColor Green
        } else {
            $testResults["otpVerification"] = $false
            Write-Host "❌ OTP Verification: FAILED - $($jsonResponse.error)" -ForegroundColor Red
        }
    } catch {
        $testResults["otpVerification"] = $false
        Write-Host "💥 OTP Verification: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "-" * 50
}

# SUMMARY REPORT
Write-Host ""
Write-Host "=" * 60
Write-Host "📊 COMPREHENSIVE TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host "=" * 60

$totalTests = $testResults.Keys.Count
$passedTests = ($testResults.Values | Where-Object { $_ -eq $true }).Count
$failedTests = ($testResults.Values | Where-Object { $_ -eq $false }).Count
$skippedTests = ($testResults.Values | Where-Object { $_ -eq $null }).Count

Write-Host "📈 Overall Results:" -ForegroundColor Yellow
Write-Host "   Total Tests: $totalTests"
Write-Host "   ✅ Passed: $passedTests" -ForegroundColor Green
Write-Host "   ❌ Failed: $failedTests" -ForegroundColor Red
Write-Host "   ⏭️ Skipped: $skippedTests" -ForegroundColor Gray

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Yellow

foreach ($test in $testResults.GetEnumerator()) {
    $status = switch ($test.Value) {
        $true { "✅ PASS" }
        $false { "❌ FAIL" }
        $null { "⏭️ SKIP" }
    }
    
    $testName = switch ($test.Key) {
        "otpGeneration" { "OTP Generation" }
        "otpVerification" { "OTP Verification" }
        "directSMS" { "Direct SMS" }
        "orderNotification" { "Order Notification" }
        "phoneFormatting" { "Phone Formatting" }
    }
    
    Write-Host "   $testName`: $status"
}

Write-Host ""
Write-Host "📱 SMS Delivery Check:" -ForegroundColor Yellow
Write-Host "   Check phone +255683859574 for received messages"
if ($global:LastOTPCode) {
    Write-Host "   🔐 Latest OTP Code: $global:LastOTPCode"
}

Write-Host ""
Write-Host "🎯 System Status:" -ForegroundColor Yellow
if ($failedTests -eq 0) {
    Write-Host "   🎉 ALL SYSTEMS OPERATIONAL!" -ForegroundColor Green
    Write-Host "   📱 SMS system fully functional with BRIQ integration"
    Write-Host "   🔐 OTP authentication ready for production"
    Write-Host "   📦 Order notifications working"
} elseif ($passedTests -gt $failedTests) {
    Write-Host "   ⚠️ MOSTLY WORKING - Some issues detected" -ForegroundColor Yellow
    Write-Host "   🔧 Check failed tests above for details"
} else {
    Write-Host "   🚨 MAJOR ISSUES DETECTED" -ForegroundColor Red
    Write-Host "   🔧 Multiple systems need attention"
}

Write-Host ""
Write-Host "🔗 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Check phone +255683859574 for all SMS messages"
Write-Host "   2. Test login flow in web application"
Write-Host "   3. Run SQL to fix admin roles (remove customer role)"
Write-Host "   4. Deploy remaining Edge Functions if needed"

Write-Host ""
Write-Host "=" * 60
Write-Host "🏁 COMPREHENSIVE TEST COMPLETED" -ForegroundColor Green
Write-Host "=" * 60