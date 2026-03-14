/**
 * Test Edge Function Response
 * This script tests what the create-payment-link edge function actually returns
 */

const supabaseUrl = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI2NzI5NzcsImV4cCI6MjAxODI0ODk3N30.Ej-Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0';

async function testEdgeFunction() {
  try {
    console.log('\n🧪 Testing create-payment-link Edge Function\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Note: You need to provide a valid auth token
    // For testing, you can get one by logging in and checking localStorage
    const authToken = 'YOUR_AUTH_TOKEN_HERE';

    if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
      console.log('❌ Please provide a valid auth token');
      console.log('\nTo get your auth token:');
      console.log('1. Log in to the application');
      console.log('2. Open DevTools (F12)');
      console.log('3. Go to Console');
      console.log('4. Run: localStorage.getItem("sb-qpojzblbodlphwzfpxbi-auth-token")');
      console.log('5. Copy the access_token value');
      console.log('6. Replace YOUR_AUTH_TOKEN_HERE with it\n');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1000,
        description: 'Test Payment Link',
        recipient_name: 'Test User',
        recipient_phone: '255754000000'
      })
    });

    const data = await response.json();

    console.log('📊 EDGE FUNCTION RESPONSE:\n');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (data.success) {
      console.log('✅ SUCCESS\n');
      console.log('Key Fields:');
      console.log(`  slug: ${data.slug}`);
      console.log(`  payment_link_url: ${data.payment_link_url}`);
      console.log(`  checkout_url: ${data.checkout_url}`);
      console.log(`  reference: ${data.reference}\n`);

      console.log('📤 SHAREABLE LINK (What to share with customers):');
      console.log(`  ${data.payment_link_url}\n`);

      console.log('💳 SNIPPE CHECKOUT LINK (Where they pay):');
      console.log(`  ${data.checkout_url}\n`);

      console.log('🔗 TEST LINK (Local):');
      console.log(`  http://localhost:5173/pay/${data.slug}\n`);
    } else {
      console.log('❌ ERROR\n');
      console.log(data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEdgeFunction();
