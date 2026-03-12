# SmartCart SMS Test Script
# This script sends both OTP and direct SMS to 0683859574 (+255683859574)

Write-Host "SmartCart SMS Test Script" -ForegroundColor Green
Write-Host "Target Phone: 0683859574 (+255683859574)" -ForegroundColor Yellow
Write-Host "=================================================="

# Configuration
$SUPABASE_URL = "https://qpojzblbodlphwzfpxbi.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg"
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/briq-sms"

# Headers for all requests
$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Function to make API call and display results
function Invoke-SMSTest {
    param(
        [string]$TestName,
        [string]$Body,
        [string]$Description
    )
    
    Write-Host ""
    Write-Host "Test: $TestName" -ForegroundColor Cyan
    Write-Host "Description: $Description" -ForegroundColor Gray
    Write-Host "Payload: $Body" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $Body -UseBasicParsing
        
        Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Parse and format JSON response
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            Write-Host "Response:" -ForegroundColor Yellow
            Write-Host ($jsonResponse | ConvertTo-Json -Depth 10) -ForegroundColor White
            
            # Extract key information
            if ($jsonResponse.success) {
                Write-Host "SUCCESS: $($jsonResponse.message)" -ForegroundColor Green
                
                # Show OTP code if available
                if ($jsonResponse.briq_response -and $jsonResponse.briq_response.code) {
                    Write-Host "OTP Code: $($jsonResponse.briq_response.code)" -ForegroundColor Magenta
                }
                
                # Show SMS stats if available
                if ($jsonResponse.details -and $jsonResponse.details.stats) {
                    $stats = $jsonResponse.details.stats
                    Write-Host "SMS Stats: Recipients: $($stats.recipients), Parts: $($stats.sms_parts), Cost: $($stats.cost)" -ForegroundColor Blue
                }
            } else {
                Write-Host "FAILED: $($jsonResponse.error)" -ForegroundColor Red
            }
            
        } catch {
            Write-Host "Raw Response: $($response.Content)" -ForegroundColor White
        }
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorResponse = $reader.ReadToEnd()
                Write-Host "Error Response: $errorResponse" -ForegroundColor Red
            } catch {
                Write-Host "Could not read error response" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "--------------------------------------------------"
}

# Test 1: Generate OTP for the user
Write-Host ""
Write-Host "TEST 1: OTP GENERATION" -ForegroundColor Yellow
$otpPayload = @{
    action = "generate_otp"
    email = "kilindosaid771@gmail.com"
} | ConvertTo-Json

Invoke-SMSTest -TestName "OTP Generation" -Body $otpPayload -Description "Generate OTP for kilindosaid771@gmail.com and send to +255683859574"

# Wait a moment between tests
Start-Sleep -Seconds 2

# Test 2: Send Direct SMS
Write-Host ""
Write-Host "TEST 2: DIRECT SMS" -ForegroundColor Yellow
$smsPayload = @{
    phone_number = "+255683859574"
    message = "Hello from SmartCart! This is a test SMS sent at $(Get-Date -Format 'HH:mm:ss'). Your e-commerce platform is working perfectly!"
} | ConvertTo-Json

Invoke-SMSTest -TestName "Direct SMS" -Body $smsPayload -Description "Send direct SMS message to +255683859574"

# Wait a moment between tests
Start-Sleep -Seconds 2

# Test 3: Send Another Direct SMS with Different Content
Write-Host ""
Write-Host "TEST 3: NOTIFICATION SMS" -ForegroundColor Yellow
$notificationPayload = @{
    phone_number = "0683859574"
    message = "SmartCart Notification: Your order #SC001 has been confirmed and is being processed. Thank you for shopping with us!"
} | ConvertTo-Json

Invoke-SMSTest -TestName "Order Notification" -Body $notificationPayload -Description "Send order notification SMS to 0683859574 (will be formatted to +255683859574)"

# Test 4: Test Phone Number Formatting
Write-Host ""
Write-Host "TEST 4: PHONE FORMAT TEST" -ForegroundColor Yellow
$formatTestPayload = @{
    phone_number = "683859574"
    message = "Phone Format Test: This message was sent to '683859574' which should be auto-formatted to '+255683859574'"
} | ConvertTo-Json

Invoke-SMSTest -TestName "Phone Format Test" -Body $formatTestPayload -Description "Test automatic phone number formatting from '683859574' to '+255683859574'"

# Summary
Write-Host ""
Write-Host "=================================================="
Write-Host "TEST SUMMARY" -ForegroundColor Green
Write-Host "=================================================="
Write-Host "OTP Generation Test - Should send OTP code via SMS"
Write-Host "Direct SMS Test - Should send welcome message"  
Write-Host "Notification SMS Test - Should send order notification"
Write-Host "Phone Format Test - Should test number formatting"
Write-Host ""
Write-Host "Check phone +255683859574 for received messages!" -ForegroundColor Magenta
Write-Host "Use any received OTP codes for login testing" -ForegroundColor Cyan
Write-Host ""
Write-Host "All tests completed! Check the results above." -ForegroundColor Green