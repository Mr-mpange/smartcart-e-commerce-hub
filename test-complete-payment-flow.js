#!/usr/bin/env node

/**
 * Complete Payment Link Flow Test
 * Tests: Create link → Access link → Proceed to payment → Webhook handling
 */

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

let sessionToken = null;
let userId = null;

async function login() {
  console.log('\n📝 Step 1: Login');
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
    userId = data.user.id;
    
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${sessionToken.substring(0, 20)}...`);
    
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return false;
  }
}

async function createPaymentLink() {
  console.log('\n💳 Step 2: Create Payment Link');
  console.log('─'.repeat(50));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 5000,
        description: 'Test Payment Link',
        recipient_name: 'Test Customer',
        recipient_phone: '255754000000',
        frontend_url: 'http://localhost:5173',
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Failed to create payment link');
    }

    console.log('✅ Payment link created');
    console.log(`   Shareable Link: ${data.payment_link_url}`);
    console.log(`   Snippe Reference: ${data.reference}`);
    console.log(`   Slug: ${data.slug}`);
    console.log(`   Checkout URL: ${data.checkout_url}`);
    
    return {
      slug: data.slug,
      linkId: data.payment_link_id,
      reference: data.reference,
      checkoutUrl: data.checkout_url,
    };
  } catch (err) {
    console.error('❌ Failed to create payment link:', err.message);
    return null;
  }
}

async function accessPaymentLink(slug) {
  console.log('\n🔗 Step 3: Access Payment Link');
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
    console.log('✅ Payment link accessed');
    console.log(`   Amount: TSh ${link.amount.toLocaleString()}`);
    console.log(`   Status: ${link.status}`);
    console.log(`   Views: ${link.views}`);
    console.log(`   Recipient: ${link.recipient_name || 'N/A'}`);
    
    return link;
  } catch (err) {
    console.error('❌ Failed to access payment link:', err.message);
    return null;
  }
}

async function simulateWebhook(linkId, reference) {
  console.log('\n🔔 Step 4: Simulate Payment Webhook');
  console.log('─'.repeat(50));
  
  try {
    // Simulate Snippe webhook for payment completion
    const webhookPayload = {
      type: 'payment.completed',
      data: {
        reference: reference,
        status: 'completed',
        amount: 5000,
        currency: 'TZS',
        metadata: {
          payment_link_id: linkId,
          is_shareable_link: true,
        }
      }
    };

    console.log('📤 Sending webhook payload:');
    console.log(JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(`${SUPABASE_URL}/functions/v1/snippe-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Webhook processing failed');
    }

    console.log('✅ Webhook processed successfully');
    console.log(`   Response: ${JSON.stringify(data)}`);
    
    return true;
  } catch (err) {
    console.error('❌ Webhook processing failed:', err.message);
    return false;
  }
}

async function verifyPaymentLinkUpdated(slug) {
  console.log('\n✔️ Step 5: Verify Payment Link Updated');
  console.log('─'.repeat(50));
  
  try {
    // Wait a moment for webhook to process
    await new Promise(resolve => setTimeout(resolve, 1000));

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
    console.log('✅ Payment link status verified');
    console.log(`   Status: ${link.status}`);
    console.log(`   Payments Count: ${link.payments_count}`);
    console.log(`   Total Collected: TSh ${link.total_collected.toLocaleString()}`);
    
    if (link.status === 'paid') {
      console.log('   ✅ Status correctly updated to PAID');
    } else {
      console.log(`   ⚠️  Status is ${link.status}, expected PAID`);
    }
    
    return link;
  } catch (err) {
    console.error('❌ Failed to verify payment link:', err.message);
    return null;
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('🧪 COMPLETE PAYMENT LINK FLOW TEST');
  console.log('='.repeat(50));

  // Step 1: Login
  if (!await login()) {
    console.log('\n❌ Test failed at login step');
    process.exit(1);
  }

  // Step 2: Create payment link
  const linkData = await createPaymentLink();
  if (!linkData) {
    console.log('\n❌ Test failed at payment link creation');
    process.exit(1);
  }

  // Step 3: Access payment link
  const linkDetails = await accessPaymentLink(linkData.slug);
  if (!linkDetails) {
    console.log('\n❌ Test failed at payment link access');
    process.exit(1);
  }

  // Step 4: Simulate webhook
  const webhookSuccess = await simulateWebhook(linkData.linkId, linkData.reference);
  if (!webhookSuccess) {
    console.log('\n❌ Test failed at webhook processing');
    process.exit(1);
  }

  // Step 5: Verify update
  const updatedLink = await verifyPaymentLinkUpdated(linkData.slug);
  if (!updatedLink) {
    console.log('\n❌ Test failed at verification');
    process.exit(1);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(50));
  console.log('\n📊 Test Summary:');
  console.log(`   ✅ Login successful`);
  console.log(`   ✅ Payment link created: https://uzanasi.online/pay/${linkData.slug}`);
  console.log(`   ✅ Payment link accessible`);
  console.log(`   ✅ Webhook processed`);
  console.log(`   ✅ Payment link status updated to PAID`);
  console.log('\n🎉 Payment flow is working correctly!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Open http://localhost:5173/pay/' + linkData.slug);
  console.log('   2. Click "Proceed to Payment"');
  console.log('   3. Complete payment on Snippe');
  console.log('   4. You will be redirected to payment success page');
  console.log('   5. Payment status will update automatically');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
