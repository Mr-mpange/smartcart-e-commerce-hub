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

async function createTemboPayment() {
  console.log('\n💳 Step 2: Create Tembo Payment Link');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 5000,
        phone_number: '255754123456',
        description: 'Tembo Test Payment',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create payment');
    }

    console.log('✅ Tembo payment link created');
    console.log(`   Shareable: ${data.payment_link_url}`);
    console.log(`   Reference: ${data.tembo_reference}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Message: ${data.message}`);
    
    return data;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function runTest() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEMBO PAYMENT TEST');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  const paymentData = await createTemboPayment();

  if (paymentData) {
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEMBO PAYMENT LINK CREATED');
    console.log('='.repeat(60));
    console.log('\n📊 Payment Details:');
    console.log(`   Shareable URL: ${paymentData.payment_link_url}`);
    console.log(`   Tembo Reference: ${paymentData.tembo_reference}`);
    console.log(`   Amount: TSh 5,000`);
    console.log(`   Phone: 255754123456`);
    console.log('\n📝 Next Steps:');
    console.log(`   1. Open: http://localhost:5173/pay/${paymentData.slug}`);
    console.log(`   2. Enter phone number`);
    console.log(`   3. Click "Proceed to Payment"`);
    console.log(`   4. USSD push will be sent to 255754123456`);
    console.log(`   5. Complete payment on your phone`);
  }
}

runTest().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
