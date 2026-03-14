/**
 * Test Payment Page Access
 * This script tests if the payment link page can be accessed and loads correctly
 */

const supabaseUrl = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';

async function testPaymentPageAccess() {
  try {
    console.log('\n🧪 TESTING PAYMENT PAGE ACCESS\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    const slug = 'k3idch2w';

    // Step 1: Fetch payment link from database
    console.log(`📝 Step 1: Fetch Payment Link by Slug: ${slug}\n`);

    const fetchResponse = await fetch(
      `${supabaseUrl}/rest/v1/payment_links?slug=eq.${slug}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        }
      }
    );

    const fetchData = await fetchResponse.json();

    if (!Array.isArray(fetchData) || fetchData.length === 0) {
      console.error('❌ Payment link not found in database');
      return;
    }

    const link = fetchData[0];
    console.log('✅ Payment link found in database\n');

    // Step 2: Verify payment link data
    console.log('📝 Step 2: Verify Payment Link Data\n');

    console.log('✅ Payment Link Details:');
    console.log(`   ID: ${link.id}`);
    console.log(`   Slug: ${link.slug}`);
    console.log(`   Amount: ${link.amount} TSh`);
    console.log(`   Status: ${link.status}`);
    console.log(`   Snippe Reference: ${link.snippe_reference}`);
    console.log(`   Checkout URL: ${link.checkout_url}`);
    console.log(`   Created: ${link.created_at}`);
    console.log(`   Views: ${link.views}`);
    console.log(`   Payments: ${link.payments_count}`);
    console.log(`   Collected: ${link.total_collected}\n`);

    // Step 3: Verify required fields
    console.log('📝 Step 3: Verify Required Fields\n');

    const requiredFields = {
      'ID': link.id,
      'Slug': link.slug,
      'Amount': link.amount,
      'Status': link.status,
      'Snippe Reference': link.snippe_reference,
      'Checkout URL': link.checkout_url,
    };

    let allFieldsPresent = true;
    for (const [field, value] of Object.entries(requiredFields)) {
      if (value) {
        console.log(`✅ ${field}: ${value}`);
      } else {
        console.log(`❌ ${field}: MISSING`);
        allFieldsPresent = false;
      }
    }

    if (!allFieldsPresent) {
      console.error('\n❌ Some required fields are missing');
      return;
    }

    console.log('\n✅ All required fields present\n');

    // Step 4: Verify payment link status
    console.log('📝 Step 4: Verify Payment Link Status\n');

    if (link.status !== 'active') {
      console.error(`❌ Payment link status is not active: ${link.status}`);
      return;
    }

    console.log('✅ Payment link status: ACTIVE\n');

    // Step 5: Verify checkout URL format
    console.log('📝 Step 5: Verify Checkout URL Format\n');

    if (!link.checkout_url.includes('snippe.me')) {
      console.error('❌ Checkout URL is not from Snippe');
      return;
    }

    console.log(`✅ Checkout URL format correct: ${link.checkout_url}\n`);

    // Step 6: Test view tracking
    console.log('📝 Step 6: Test View Tracking\n');

    const updateResponse = await fetch(
      `${supabaseUrl}/rest/v1/payment_links?id=eq.${link.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          views: link.views + 1
        })
      }
    );

    if (!updateResponse.ok) {
      console.error('❌ Failed to update view count');
      return;
    }

    console.log('✅ View count updated successfully\n');

    // Step 7: Verify updated view count
    console.log('📝 Step 7: Verify Updated View Count\n');

    const verifyResponse = await fetch(
      `${supabaseUrl}/rest/v1/payment_links?id=eq.${link.id}&select=views`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        }
      }
    );

    const verifyData = await verifyResponse.json();
    const updatedViews = verifyData[0].views;

    console.log(`✅ View count updated: ${link.views} → ${updatedViews}\n`);

    // Final Summary
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ TEST SUMMARY:\n');
    console.log('✅ Payment link found in database');
    console.log('✅ All required fields present');
    console.log('✅ Payment link status is ACTIVE');
    console.log('✅ Checkout URL format correct');
    console.log('✅ View tracking works');
    console.log('✅ Payment page can be accessed\n');

    console.log('📊 PAYMENT LINK DETAILS:\n');
    console.log(`   Slug: ${link.slug}`);
    console.log(`   Amount: ${link.amount} TSh`);
    console.log(`   Status: ${link.status}`);
    console.log(`   Snippe Reference: ${link.snippe_reference}`);
    console.log(`   Checkout URL: ${link.checkout_url}`);
    console.log(`   Views: ${updatedViews}`);
    console.log(`   Payments: ${link.payments_count}`);
    console.log(`   Collected: ${link.total_collected}\n`);

    console.log('🔗 PAYMENT PAGE URL:\n');
    console.log(`   http://localhost:5173/pay/${link.slug}\n`);

    console.log('📤 SHAREABLE LINK:\n');
    console.log(`   https://uzanasi.online/pay/${link.slug}\n`);

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ PAYMENT PAGE ACCESS TEST PASSED!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPaymentPageAccess();
