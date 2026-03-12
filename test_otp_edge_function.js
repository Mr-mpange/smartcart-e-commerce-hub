// Test Consolidated Briq SMS Function with OTP
// This script tests the briq-sms Edge Function with OTP actions

const SUPABASE_URL = 'https://kdiegxbfuohrbktonkmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaWVneGJmdW9ocmJrdG9ua21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTIzMTYsImV4cCI6MjA3OTg2ODMxNn0.EyJWQtTjnTgW4uJcCqFasEn49vT1x0mSsxEz1H4CT1o';

async function testOTPGeneration() {
    console.log('🔄 Testing OTP Generation...');
    console.log('📧 Email: admin@test.com');
    console.log('📱 Expected Phone: +255683859574');
    console.log('');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                action: 'generate_otp',
                email: 'admin@test.com'
            })
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        
        const responseText = await response.text();
        console.log(`📄 Raw Response: ${responseText}`);
        
        try {
            const result = JSON.parse(responseText);
            
            if (response.ok && result.success) {
                console.log('✅ OTP GENERATION SUCCESSFUL!');
                console.log('📱 SMS should be sent to +255683859574');
                console.log('⏰ OTP expires in:', result.expires_in, 'seconds');
                
                // Prompt for OTP verification test
                console.log('');
                console.log('🔢 To test OTP verification, check your phone for the SMS');
                console.log('💡 Then run: testOTPVerification("123456") with the actual OTP');
                
                return true;
            } else {
                console.log('❌ OTP GENERATION FAILED');
                console.log('📄 Error:', result.error);
                
                if (result.error?.includes('not configured')) {
                    console.log('🔧 ISSUE: Briq API key not configured');
                    console.log('💡 SOLUTION: Set BRIQ_API_KEY in Supabase Edge Functions');
                } else if (result.error?.includes('User not found')) {
                    console.log('🔧 ISSUE: Admin user not found');
                    console.log('💡 SOLUTION: Check if admin@test.com exists in auth.users');
                } else if (result.error?.includes('phone number')) {
                    console.log('🔧 ISSUE: No phone number in profile');
                    console.log('💡 SOLUTION: Run fix_admin_profile.sql');
                }
                
                return false;
            }
        } catch (parseError) {
            console.log('❌ INVALID JSON RESPONSE');
            console.log('🔧 ISSUE: Edge Function not deployed or returning HTML');
            console.log('💡 SOLUTION: Deploy with: npx supabase functions deploy briq-sms');
            return false;
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log('📄 Error:', error.message);
        return false;
    }
}

async function testOTPVerification(otpCode) {
    console.log('');
    console.log('🔄 Testing OTP Verification...');
    console.log(`🔢 OTP Code: ${otpCode}`);
    console.log('');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                action: 'verify_otp',
                email: 'admin@test.com',
                otp_code: otpCode
            })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            console.log('✅ OTP VERIFICATION SUCCESSFUL!');
            console.log('📱 Phone:', result.phone_number);
            console.log('🎉 Login flow would complete successfully');
        } else {
            console.log('❌ OTP VERIFICATION FAILED');
            console.log('📄 Error:', result.error);
            
            if (result.error?.includes('Invalid or expired')) {
                console.log('🔧 ISSUE: Wrong OTP or expired');
                console.log('💡 SOLUTION: Check the SMS and try again');
            }
        }
        
    } catch (error) {
        console.log('❌ VERIFICATION ERROR');
        console.log('📄 Error:', error.message);
    }
}

// Make testOTPVerification available globally for manual testing
global.testOTPVerification = testOTPVerification;

// Run the test
testOTPGeneration().then((success) => {
    console.log('');
    console.log('🏁 OTP Generation test completed');
    
    if (success) {
        console.log('');
        console.log('📋 Next Steps:');
        console.log('1. Check your phone (+255683859574) for SMS');
        console.log('2. Run: testOTPVerification("YOUR_OTP_CODE")');
        console.log('3. If successful, the OTP system is working!');
    } else {
        console.log('');
        console.log('📋 Troubleshooting:');
        console.log('1. Deploy Edge Function: npx supabase functions deploy briq-sms');
        console.log('2. Set BRIQ_API_KEY environment variable');
        console.log('3. Check admin profile exists with phone number');
    }
}).catch(console.error);