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

async function testRealPayout() {
  console.log('\n💰 Step 2: Send Real Payout to 0683859574');
  console.log('─'.repeat(60));
  
  try {
    const amount = 5000; // 5000 TSh
    const phone = '0683859574';
    const uniqueRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📱 Phone: ${phone}`);
    console.log(`💵 Amount: TSh ${amount.toLocaleString()}`);
    console.log(`🔑 Reference: ${uniqueRef}`);
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        recipient_phone: phone,
        recipient_name: 'Test User',
        amount: amount,
        description: `Real Payout Test - 5000 TSh - ${uniqueRef}`,
      }),
    });

    const data = await response.json();
    
    console.log('\n📊 Response:');
    console.log(`Status Code: ${response.status}`);
    console.log(`Response Data:`, JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Payout request successful!');
      console.log(`   Payout ID: ${data.payout_id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Tembo Reference: ${data.tembo_reference || 'N/A'}`);
      console.log(`\n📱 Check your phone (${phone}) for USSD push notification`);
      console.log(`   You should receive a payment request for TSh ${amount.toLocaleString()}`);
    } else {
      console.log('\n⚠️  Payout request failed');
      console.log(`   Error: ${data.error}`);
      if (data.details) {
        console.log(`   Details:`, JSON.stringify(data.details, null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 REAL PAYOUT TEST - TEMBO');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  await testRealPayout();
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
