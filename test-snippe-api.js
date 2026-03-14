#!/usr/bin/env node

const SNIPPE_API_KEY = 'snp_5208ca969ae0fbeee354612f424a2ccb41992be6b14cfb1269289883a940c27b';

async function testSnippeAPI() {
  console.log('\n🧪 Testing Snippe API');
  console.log('─'.repeat(60));
  
  const payload = {
    payment_type: 'mobile',
    details: {
      amount: 1000,
      currency: 'TZS',
    },
    phone_number: '255754000000',
    customer: {
      firstname: 'Test',
      lastname: 'User',
      email: 'test@example.com',
    },
    webhook_url: 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/snippe-webhook',
    redirect_url: 'https://uzanasi.online/pay/test',
    metadata: {
      test: true,
    },
  };

  try {
    console.log('📤 Sending request to Snippe API...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('https://api.snippe.sh/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SNIPPE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('\n📥 Response Status:', response.status);
    
    const data = await response.json();
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.data) {
      console.log('\n✅ Snippe API working!');
      console.log(`   Reference: ${data.data.reference}`);
      console.log(`   Checkout URL: https://snippe.me/p/${data.data.reference}`);
    } else {
      console.log('\n❌ Snippe API error');
      console.log(`   Error: ${data.message || data.error}`);
    }
  } catch (err) {
    console.error('❌ Request failed:', err.message);
  }
}

testSnippeAPI();
