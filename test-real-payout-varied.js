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

async function testRealPayout(amount, description) {
  console.log(`\n💰 Sending Payout: TSh ${amount}`);
  console.log('─'.repeat(60));
  
  try {
    const phone = '0683859574';
    const uniqueRef = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📱 Phone: ${phone}`);
    console.log(`💵 Amount: TSh ${amount.toLocaleString()}`);
    console.log(`📝 Description: ${description}`);
    console.log(`🔑 Reference: ${uniqueRef}`);
    
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
        description: description,
      }),
    });

    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok && data.success) {
      console.log(`✅ SUCCESS - Payout ID: ${data.payout_id}`);
      console.log(`   Tembo Reference: ${data.tembo_reference || 'N/A'}`);
      return true;
    } else {
      console.log(`❌ FAILED - Error: ${data.error}`);
      if (data.details?.reason) {
        console.log(`   Reason: ${data.details.reason}`);
      }
      return false;
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
    return false;
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 REAL PAYOUT TEST - MULTIPLE AMOUNTS');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  // Try different amounts
  const amounts = [
    { amount: 1000, desc: 'Test 1000 TSh' },
    { amount: 2500, desc: 'Test 2500 TSh' },
    { amount: 3000, desc: 'Test 3000 TSh' },
  ];

  let successCount = 0;
  for (const { amount, desc } of amounts) {
    const success = await testRealPayout(amount, desc);
    if (success) successCount++;
    
    // Wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ TEST COMPLETE - ${successCount}/${amounts.length} successful`);
  console.log('='.repeat(60));
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
