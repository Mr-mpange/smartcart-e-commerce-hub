#!/usr/bin/env node

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

let sessionToken = null;

async function login() {
  console.log('\n📝 Login');
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

async function createWithPhone() {
  console.log('\n💳 Create Payment Link WITH Phone Number');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 2000,
        description: 'Test with phone',
        recipient_name: 'John Doe',
        recipient_phone: '255754123456',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed');

    console.log('✅ Payment link created WITH phone');
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Reference: ${data.reference}`);
    console.log(`   Checkout: ${data.checkout_url}`);
    
    return data;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function createWithoutPhone() {
  console.log('\n💳 Create Payment Link WITHOUT Phone Number');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 2000,
        description: 'Test without phone',
        recipient_name: 'Jane Doe',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed');

    console.log('✅ Payment link created WITHOUT phone');
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Reference: ${data.reference}`);
    console.log(`   Checkout: ${data.checkout_url}`);
    
    return data;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST: Phone Number in Payment Flow');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  const withPhone = await createWithPhone();
  const withoutPhone = await createWithoutPhone();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));
  
  if (withPhone) {
    console.log('\n✅ WITH Phone Number:');
    console.log(`   URL: http://localhost:5173/pay/${withPhone.slug}`);
    console.log(`   Checkout: ${withPhone.checkout_url}`);
    console.log('   Expected: Phone should be pre-filled on Snippe');
  }
  
  if (withoutPhone) {
    console.log('\n✅ WITHOUT Phone Number:');
    console.log(`   URL: http://localhost:5173/pay/${withoutPhone.slug}`);
    console.log(`   Checkout: ${withoutPhone.checkout_url}`);
    console.log('   Expected: Snippe asks for phone number');
  }

  console.log('\n📝 Test both links and check Snippe checkout page');
}

runTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
