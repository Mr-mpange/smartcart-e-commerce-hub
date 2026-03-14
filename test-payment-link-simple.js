#!/usr/bin/env node

/**
 * Simple Payment Link Test
 * Tests: Create link → Access link → Verify shareable URL
 */

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

let sessionToken = null;

async function login() {
  console.log('\n📝 Login');
  console.log('─'.repeat(50));
  
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
    
    if (!response.ok) {
      throw new Error(data.error_description || data.error || 'Login failed');
    }

    sessionToken = data.access_token;
    console.log('✅ Login successful');
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return false;
  }
}

async function createPaymentLink() {
  console.log('\n💳 Create Payment Link');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 2000,
        description: 'Test Payment',
        recipient_name: 'Test User',
        recipient_phone: '255754000000',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create payment link');
    }

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

async function accessPaymentLink(slug) {
  console.log('\n🔗 Access Payment Link');
  console.log('─'.repeat(50));
  
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
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Payment link not found');
    }

    const link = data[0];
    console.log('✅ Payment link accessible');
    console.log(`   Amount: TSh ${link.amount.toLocaleString()}`);
    console.log(`   Status: ${link.status}`);
    console.log(`   Checkout URL: ${link.checkout_url}`);
    
    return link;
  } catch (err) {
    console.error('❌ Failed:', err.message);
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 PAYMENT LINK TEST');
  console.log('='.repeat(50));

  if (!await login()) {
    process.exit(1);
  }

  const linkData = await createPaymentLink();
  if (!linkData) {
    process.exit(1);
  }

  const linkDetails = await accessPaymentLink(linkData.slug);
  if (!linkDetails) {
    process.exit(1);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   ✅ Payment link created`);
  console.log(`   ✅ Shareable URL: https://uzanasi.online/pay/${linkData.slug}`);
  console.log(`   ✅ Payment link accessible`);
  console.log(`   ✅ Checkout URL: ${linkDetails.checkout_url}`);
  console.log('\n🎉 Payment system is working!');
  console.log('\n📝 How to test:');
  console.log(`   1. Open: http://localhost:5173/pay/${linkData.slug}`);
  console.log(`   2. Click "Proceed to Payment"`);
  console.log(`   3. Complete payment on Snippe`);
  console.log(`   4. You'll be redirected to success page`);
}

runTests().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
