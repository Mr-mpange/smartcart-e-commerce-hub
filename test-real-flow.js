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

async function createPaymentLink() {
  console.log('\n💳 Step 2: Create Payment Link');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 5000,
        description: 'Real Payment Test',
        recipient_name: 'Test User',
        recipient_phone: '255754000000',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create');

    console.log('✅ Payment link created');
    console.log(`   Shareable: ${data.payment_link_url}`);
    console.log(`   Reference: ${data.reference}`);
    console.log(`   Slug: ${data.slug}`);
    
    return data;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function checkPaymentStatus(slug) {
  console.log('\n🔗 Step 3: Check Payment Status');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/payment_links?slug=eq.${slug}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) throw new Error('Not found');

    const link = data[0];
    console.log('✅ Payment link status:');
    console.log(`   Status: ${link.status}`);
    console.log(`   Amount: TSh ${link.amount.toLocaleString()}`);
    console.log(`   Payments: ${link.payments_count}`);
    console.log(`   Collected: TSh ${link.total_collected.toLocaleString()}`);
    
    return link;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function runRealFlow() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 REAL PAYMENT FLOW TEST');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  const linkData = await createPaymentLink();
  if (!linkData) {
    process.exit(1);
  }

  const linkStatus = await checkPaymentStatus(linkData.slug);
  if (!linkStatus) {
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ PAYMENT LINK READY FOR REAL PAYMENT');
  console.log('='.repeat(60));
  console.log('\n📊 Payment Link Details:');
  console.log(`   Shareable URL: https://uzanasi.online/pay/${linkData.slug}`);
  console.log(`   Local URL: http://localhost:5173/pay/${linkData.slug}`);
  console.log(`   Snippe Reference: ${linkData.reference}`);
  console.log(`   Amount: TSh ${linkStatus.amount.toLocaleString()}`);
  console.log(`   Status: ${linkStatus.status}`);
  console.log('\n📝 Next Steps:');
  console.log(`   1. Open: http://localhost:5173/pay/${linkData.slug}`);
  console.log(`   2. You should see: "Payment Request" with status "Active"`);
  console.log(`   3. Click "Proceed to Payment"`);
  console.log(`   4. Snippe checkout opens in new tab`);
  console.log(`   5. Complete payment on Snippe`);
  console.log(`   6. You'll be redirected to success page`);
  console.log(`   7. Status will change to "Paid"`);
  console.log('\n🎉 Ready to test real payment flow!');
}

runRealFlow().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
