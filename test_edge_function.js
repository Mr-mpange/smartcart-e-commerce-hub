// Edge Function Diagnostic Test
// This script checks if the Supabase Edge Functions are working

const SUPABASE_URL = 'https://kdiegxbfuohrbktonkmh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaWVneGJmdW9ocmJrdG9ua21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyOTIzMTYsImV4cCI6MjA3OTg2ODMxNn0.EyJWQtTjnTgW4uJcCqFasEn49vT1x0mSsxEz1H4CT1o';

async function testEdgeFunction() {
    console.log('🔄 Testing Supabase Edge Function deployment...');
    console.log(`🌐 URL: ${SUPABASE_URL}/functions/v1/briq-sms`);
    console.log('');
    
    try {
        // Test OPTIONS request (CORS preflight)
        console.log('1️⃣ Testing CORS preflight...');
        const optionsResponse = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            }
        });
        
        console.log(`   Status: ${optionsResponse.status}`);
        console.log(`   Headers:`, Object.fromEntries(optionsResponse.headers.entries()));
        
        if (optionsResponse.ok) {
            console.log('   ✅ CORS preflight successful');
        } else {
            console.log('   ❌ CORS preflight failed');
        }
        
        console.log('');
        
        // Test POST request with minimal data
        console.log('2️⃣ Testing POST request...');
        const postResponse = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
                phone_number: '+255683859574',
                message: 'Test message'
            })
        });
        
        console.log(`   Status: ${postResponse.status}`);
        console.log(`   Content-Type: ${postResponse.headers.get('content-type')}`);
        
        const responseText = await postResponse.text();
        console.log(`   Raw Response: ${responseText.substring(0, 200)}...`);
        
        // Try to parse as JSON
        try {
            const jsonResponse = JSON.parse(responseText);
            console.log('   ✅ Valid JSON response');
            console.log('   📄 Parsed:', JSON.stringify(jsonResponse, null, 2));
            
            if (jsonResponse.error?.includes('not configured')) {
                console.log('   🔧 ISSUE: Briq API key not configured in Edge Function');
                console.log('   💡 SOLUTION: Set BRIQ_API_KEY environment variable');
            }
        } catch (parseError) {
            console.log('   ❌ Invalid JSON response');
            console.log('   🔧 ISSUE: Edge Function returning HTML instead of JSON');
            console.log('   💡 SOLUTION: Check Edge Function deployment');
            
            if (responseText.includes('The deployment')) {
                console.log('   📋 Likely deployment issue - function may not be deployed');
            }
        }
        
    } catch (error) {
        console.log('❌ NETWORK ERROR');
        console.log('📄 Error:', error.message);
    }
}

testEdgeFunction().then(() => {
    console.log('');
    console.log('🏁 Diagnostic completed');
    console.log('');
    console.log('📋 Common Solutions:');
    console.log('1. Deploy Edge Functions: npx supabase functions deploy briq-sms');
    console.log('2. Set environment variables in Supabase dashboard');
    console.log('3. Check function logs in Supabase dashboard');
}).catch(console.error);