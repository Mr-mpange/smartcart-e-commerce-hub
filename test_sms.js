// SMS Test Script for SmartCart
// This script tests SMS sending to the admin phone number

const SUPABASE_URL = 'https://kdiegxbfuohrbktonkmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaWVneGJmdW9ocmJrdG9ua21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTIzMTYsImV4cCI6MjA3OTg2ODMxNn0.EyJWQtTjnTgW4uJcCqFasEn49vT1x0mSsxEz1H4CT1o';

async function testSMS() {
    const adminPhone = '+255683859574';
    const testMessage = 'Test SMS from SmartCart - OTP: 123456';
    
    console.log('🔄 Testing SMS sending...');
    console.log(`📱 Phone: ${adminPhone}`);
    console.log(`💬 Message: ${testMessage}`);
    console.log('');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                phone_number: adminPhone,
                message: testMessage
            })
        });
        
        const result = await response.json();
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
        console.log('');
        
        if (response.ok && result.success) {
            console.log('✅ SMS SENT SUCCESSFULLY!');
            console.log('📄 Response Details:', JSON.stringify(result, null, 2));
        } else {
            console.log('❌ SMS FAILED');
            console.log('📄 Error Details:', JSON.stringify(result, null, 2));
            
            // Check common issues
            if (result.error?.includes('BRIQ_API_KEY')) {
                console.log('');
                console.log('🔧 ISSUE: Briq API Key not configured');
                console.log('💡 SOLUTION: Set BRIQ_API_KEY environment variable in Supabase Edge Functions');
            } else if (result.error?.includes('not configured')) {
                console.log('');
                console.log('🔧 ISSUE: SMS service not properly configured');
                console.log('💡 SOLUTION: Check Supabase environment variables');
            } else if (response.status === 401) {
                console.log('');
                console.log('🔧 ISSUE: Authentication failed');
                console.log('💡 SOLUTION: Check Supabase API key');
            }
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log('📄 Error:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('');
            console.log('🔧 ISSUE: Cannot connect to Supabase');
            console.log('💡 SOLUTION: Check internet connection and Supabase URL');
        }
    }
}

// Run the test
testSMS().then(() => {
    console.log('');
    console.log('🏁 Test completed');
}).catch(console.error);