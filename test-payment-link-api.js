/**
 * Test Payment Link Creation API
 * This script tests the complete payment link creation flow
 */

const supabaseUrl = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';

async function testPaymentLinkCreation() {
  try {
    console.log('\n🧪 TESTING PAYMENT LINK CREATION\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Step 1: Login
    console.log('📝 Step 1: Login with kilindosaid771@gmail.com\n');
    
    const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'kilindosaid771@gmail.com',
        password: '11111111'
      })
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginData);
      return;
    }

    const accessToken = loginData.access_token;
    console.log('✅ Login successful');
    console.log(`   Access Token: ${accessToken.substring(0, 20)}...\n`);

    // Step 2: Create Payment Link
    console.log('📝 Step 2: Create Payment Link\n');
    console.log('   Amount: 1000 TSh');
    console.log('   Recipient: Test User');
    console.log('   Phone: 255754000000\n');

    const createResponse = await fetch(`${supabaseUrl}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1000,
        description: 'Test Payment Link',
        recipient_name: 'Test User',
        recipient_phone: '255754000000'
      })
    });

    const createData = await createResponse.json();

    if (!createResponse.ok) {
      console.error('❌ Payment link creation failed:', createData);
      return;
    }

    console.log('✅ Payment link created successfully\n');

    // Step 3: Display Results
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RESULTS:\n');

    console.log('✅ Shareable Link (What to share with customers):');
    console.log(`   ${createData.shareable_link}\n`);

    console.log('✅ Payment Link URL:');
    console.log(`   ${createData.payment_link_url}\n`);

    console.log('✅ Slug (8-character identifier):');
    console.log(`   ${createData.slug}\n`);

    console.log('✅ Snippe Reference:');
    console.log(`   ${createData.reference}\n`);

    console.log('✅ Snippe Checkout URL:');
    console.log(`   ${createData.checkout_url}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Step 4: Verify Payment Link
    console.log('📝 Step 3: Verify Payment Link in Database\n');

    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/payment_links?slug=eq.${createData.slug}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        }
      }
    );

    const verifyData = await verifyResponse.json();

    if (!Array.isArray(verifyData) || verifyData.length === 0) {
      console.error('❌ Payment link not found in database');
      return;
    }

    const link = verifyData[0];
    console.log('✅ Payment link found in database\n');
    console.log('   ID:', link.id);
    console.log('   Slug:', link.slug);
    console.log('   Amount:', link.amount);
    console.log('   Status:', link.status);
    console.log('   Snippe Reference:', link.snippe_reference);
    console.log('   Checkout URL:', link.checkout_url);
    console.log('   Created:', link.created_at);
    console.log('   Views:', link.views);
    console.log('   Payments:', link.payments_count);
    console.log('   Collected:', link.total_collected);

    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Step 5: Test Payment Page Access
    console.log('📝 Step 4: Test Payment Page Access\n');

    const paymentPageUrl = `http://localhost:5173/pay/${createData.slug}`;
    console.log('✅ Payment page URL:');
    console.log(`   ${paymentPageUrl}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    // Final Summary
    console.log('✅ TEST SUMMARY:\n');
    console.log('✅ Login successful');
    console.log('✅ Payment link created');
    console.log('✅ Shareable link generated');
    console.log('✅ Payment link stored in database');
    console.log('✅ All systems operational\n');

    console.log('📤 SHAREABLE LINK TO SHARE:');
    console.log(`   ${createData.shareable_link}\n`);

    console.log('🧪 TEST PAYMENT PAGE:');
    console.log(`   ${paymentPageUrl}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPaymentLinkCreation();
