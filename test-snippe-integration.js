/**
 * Local Snippe Integration Test
 * Tests if we can create payments on Snippe and access them
 */

const SNIPPE_API_KEY = process.env.SNIPPE_API_KEY || 'your-api-key-here';
const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';

console.log('='.repeat(60));
console.log('SNIPPE INTEGRATION TEST');
console.log('='.repeat(60));

// Test 1: Check API Key
console.log('\n[TEST 1] Checking SNIPPE_API_KEY...');
if (!SNIPPE_API_KEY || SNIPPE_API_KEY === 'your-api-key-here') {
  console.error('❌ SNIPPE_API_KEY not set!');
  console.log('   Set it with: export SNIPPE_API_KEY=your-key');
  process.exit(1);
} else {
  console.log('✅ SNIPPE_API_KEY is set');
  console.log(`   Key length: ${SNIPPE_API_KEY.length} characters`);
}

// Test 2: Create a test payment
console.log('\n[TEST 2] Creating test payment on Snippe...');

const testPayload = {
  payment_type: 'mobile',
  details: {
    amount: 1000,
    currency: 'TZS',
  },
  phone_number: '+255700000000',
  customer: {
    firstname: 'Test',
    lastname: 'User',
    email: 'test@example.com',
  },
  webhook_url: `${SUPABASE_URL}/functions/v1/snippe-webhook`,
  redirect_url: 'https://uzanasi.online/pay/test-123',
  metadata: {
    test: true,
    created_at: new Date().toISOString()
  },
  description: 'Test payment for debugging'
};

console.log('Payload:');
console.log(JSON.stringify(testPayload, null, 2));

fetch('https://api.snippe.sh/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SNIPPE_API_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': `test-${Date.now()}`,
  },
  body: JSON.stringify(testPayload),
})
  .then(response => {
    console.log(`\nSnippе Response Status: ${response.status}`);
    return response.json();
  })
  .then(data => {
    console.log('\nSnippе Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data?.reference) {
      const reference = data.data.reference;
      console.log(`\n✅ Payment created successfully!`);
      console.log(`   Reference: ${reference}`);
      console.log(`   Checkout URL: https://snippe.me/p/${reference}`);

      // Test 3: Try to access the payment link
      console.log('\n[TEST 3] Testing if payment link is accessible...');
      const snippeUrl = `https://snippe.me/p/${reference}`;
      console.log(`   Testing: ${snippeUrl}`);

      return fetch(snippeUrl, { method: 'HEAD' })
        .then(response => {
          if (response.status === 200) {
            console.log(`✅ Payment link is accessible (HTTP ${response.status})`);
          } else {
            console.log(`⚠️  Payment link returned HTTP ${response.status}`);
          }
        })
        .catch(err => {
          console.log(`⚠️  Could not access payment link: ${err.message}`);
        });
    } else if (data.error) {
      console.log(`\n❌ Snippе API Error:`);
      console.log(`   Error: ${data.error}`);
      console.log(`   Message: ${data.message}`);
      console.log(`   Details: ${JSON.stringify(data.details)}`);
    } else {
      console.log(`\n❌ Unexpected response from Snippе`);
      console.log(`   No reference or error in response`);
    }
  })
  .catch(error => {
    console.error('\n❌ Failed to call Snippе API:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
  })
  .finally(() => {
    console.log('\n' + '='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
  });
