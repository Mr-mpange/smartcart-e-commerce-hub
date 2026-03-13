// Test the complete login flow with phone number formatting
const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';

async function testOTPGeneration() {
    console.log('🧪 Testing OTP Generation for kilindosaid771@gmail.com');
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                action: 'generate_otp',
                email: 'kilindosaid771@gmail.com'
            })
        });
        
        const result = await response.text();
        console.log('📡 Response Status:', response.status);
        console.log('📦 Response:', result);
        
        if (response.ok) {
            console.log('✅ OTP Generation Success');
            return JSON.parse(result);
        } else {
            console.log('❌ OTP Generation Failed');
            return null;
        }
    } catch (error) {
        console.error('❌ Error:', error);
        return null;
    }
}

// Run the test
testOTPGeneration();