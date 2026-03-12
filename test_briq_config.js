// Test Briq Configuration
// This script tests if the Briq API key is properly configured

const SUPABASE_URL = 'https://kdiegxbfuohrbktonkmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaWVneGJmdW9ocmJrdG9ua21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTIzMTYsImV4cCI6MjA3OTg2ODMxNn0.EyJWQtTjnTgW4uJcCqFasEn49vT1x0mSsxEz1H4CT1o';

async function testBriqConfig() {
    console.log('🔄 Testing Briq SMS Configuration...');
    console.log('📱 Phone: +255683859574');
    console.log('💬 Message: Test SMS from SmartCart');
    console.log('');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                phone_number: '+255683859574',
                message: 'Test SMS from SmartCart - Configuration Check'
            })
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
        
        const result = await response.json();
        console.log('📄 Response:', JSON.stringify(result, null, 2));
        
        if (response.ok && result.success) {
            console.log('✅ SMS SENT SUCCESSFULLY!');
            console.log('📱 Check your phone for the SMS');
            console.log('🎉 Briq API is properly configured');
        } else {
            console.log('❌ SMS FAILED');
            
            if (result.error?.includes('API key')) {
                console.log('🔧 ISSUE: Briq API key problem');
                console.log('💡 SOLUTIONS:');
                console.log('   1. Check if BRIQ_API_KEY is set in Supabase Edge Functions');
                console.log('   2. Verify API key is valid at https://dashboard.briq.tz/');
                console.log('   3. Ensure API key has SMS permissions');
            } else if (result.error?.includes('HTML error page')) {
                console.log('🔧 ISSUE: Briq API returning HTML instead of JSON');
                console.log('💡 SOLUTIONS:');
                console.log('   1. API key is likely invalid or expired');
                console.log('   2. Check Briq API endpoint is correct');
                console.log('   3. Verify account has sufficient balance');
            } else if (result.error?.includes('not configured')) {
                console.log('🔧 ISSUE: BRIQ_API_KEY environment variable not set');
                console.log('💡 SOLUTION: Set BRIQ_API_KEY in Supabase Dashboard');
            } else {
                console.log('🔧 ISSUE: Unknown error');
                console.log('💡 Check the error details above');
            }
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log('📄 Error:', error.message);
    }
}

testBriqConfig().then(() => {
    console.log('');
    console.log('🏁 Configuration test completed');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. If API key issue: Get valid key from https://dashboard.briq.tz/');
    console.log('2. Set in Supabase: Dashboard → Edge Functions → Environment Variables');
    console.log('3. Redeploy function: npx supabase functions deploy briq-sms');
    console.log('4. Test again with this script');
}).catch(console.error);