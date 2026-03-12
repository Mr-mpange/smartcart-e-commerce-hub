// Direct Briq API Test
// This script tests the Briq SMS API directly without going through Supabase Edge Functions

async function testBriqDirect() {
    const adminPhone = '+255683859574';
    const testMessage = 'Test SMS from SmartCart - OTP: 123456';
    
    console.log('🔄 Testing Briq API directly...');
    console.log(`📱 Phone: ${adminPhone}`);
    console.log(`💬 Message: ${testMessage}`);
    console.log('');
    
    // You need to set your Briq API key here
    const BRIQ_API_KEY = 'YOUR_BRIQ_API_KEY_HERE';
    
    if (BRIQ_API_KEY === 'YOUR_BRIQ_API_KEY_HERE') {
        console.log('❌ BRIQ API KEY NOT SET');
        console.log('💡 Please set your Briq API key in this script');
        console.log('🔧 Get your API key from: https://dashboard.briq.tz/');
        return;
    }
    
    try {
        const response = await fetch('https://api.briq.tz/v1/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${BRIQ_API_KEY}`,
            },
            body: JSON.stringify({
                phone: adminPhone,
                message: testMessage,
                sender_id: 'SmartCart',
            }),
        });
        
        const result = await response.json();
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log('📄 Response:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
            console.log('✅ SMS SENT SUCCESSFULLY via Briq API!');
            console.log('📱 Check your phone for the SMS');
        } else {
            console.log('❌ SMS FAILED');
            
            // Check common Briq API errors
            if (response.status === 401) {
                console.log('🔧 ISSUE: Invalid API key');
                console.log('💡 SOLUTION: Check your Briq API key');
            } else if (response.status === 400) {
                console.log('🔧 ISSUE: Bad request');
                console.log('💡 SOLUTION: Check phone number format and message');
            } else if (response.status === 402) {
                console.log('🔧 ISSUE: Insufficient balance');
                console.log('💡 SOLUTION: Top up your Briq account');
            }
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log('📄 Error:', error.message);
    }
}

// Test with mock API key (will show instructions)
testBriqDirect().then(() => {
    console.log('');
    console.log('🏁 Test completed');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Get your Briq API key from https://dashboard.briq.tz/');
    console.log('2. Replace YOUR_BRIQ_API_KEY_HERE with your actual key');
    console.log('3. Run this script again to test SMS sending');
    console.log('4. If successful, add the API key to Supabase Edge Functions environment');
}).catch(console.error);