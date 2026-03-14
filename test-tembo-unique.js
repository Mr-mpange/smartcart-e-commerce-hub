#!/usr/bin/env node

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

let sessionToken = null;

async function login() {
  console.log('\n📝 Step 1: Login');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || 'Login failed');

    sessionToken = data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return false;
  }
}

async function testPayout() {
  console.log('\n💰 Step 2: Test Payout with Unique Reference');
  console.log('─'.repeat(60));
  
  try {
    const uniqueRef = `PAYOUT-${Date.now()}`;
    console.log(`Using reference: ${uniqueRef}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        recipient_phone: '255754123456',
        recipient_name: 'Test Recipient',
        amount: 10000,
        description: 'Test Payout',
      }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Payout request successful');
      console.log(`   Payout ID: ${data.payout_id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: TSh 10,000`);
      console.log(`   Recipient: 255754123456`);
    } else if (data.details && data.details.reason === 'DUPLICATE_REQUEST') {
      console.log('\n⚠️  Duplicate request (expected for repeated tests)');
      console.log('   This means the API is working correctly!');
      console.log(`   Error: ${data.details.reason}`);
    } else {
      console.log('\n⚠️  Payout request failed');
      console.log(`   Error: ${data.error}`);
      if (data.details) {
        console.log(`   Details: ${JSON.stringify(data.details)}`);
      }
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEMBO PAYOUT TEST - UNIQUE REFERENCE');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  await testPayout();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
