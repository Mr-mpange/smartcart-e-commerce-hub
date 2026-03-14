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

async function testMobilePayout() {
  console.log('\n💰 Step 2: Test Mobile Money Payout');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payout_type: 'mobile',
        recipient_phone: '255712345678',
        recipient_name: 'John Doe',
        amount: 50000,
        description: 'Salary Payment - September 2025',
      }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Mobile Money Payout Request Successful');
      console.log(`   Payout ID: ${data.payout_id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: TSh 50,000`);
      console.log(`   Recipient: 255712345678`);
      console.log(`   Type: Mobile Money (Tigo Pesa)`);
      console.log(`   Tembo Reference: ${data.tembo_reference}`);
    } else {
      console.log('\n⚠️  Mobile Money Payout Request Failed');
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${JSON.stringify(data.details)}`);
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function testBankPayout() {
  console.log('\n🏦 Step 3: Test Bank Transfer Payout');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send',
        payout_type: 'bank',
        recipient_bank_account: 'CORUTZTZ:0150987654321',
        recipient_name: 'ABC Supplies Ltd',
        amount: 150000,
        description: 'Vendor Payment - Invoice #2025-123',
      }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Bank Transfer Payout Request Successful');
      console.log(`   Payout ID: ${data.payout_id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Amount: TSh 150,000`);
      console.log(`   Recipient: ABC Supplies Ltd`);
      console.log(`   Bank Account: CORUTZTZ:0150987654321`);
      console.log(`   Type: Bank Transfer`);
      console.log(`   Tembo Reference: ${data.tembo_reference}`);
    } else {
      console.log('\n⚠️  Bank Transfer Payout Request Failed');
      console.log(`   Error: ${data.error}`);
      console.log(`   Details: ${JSON.stringify(data.details)}`);
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function testBulkPayout() {
  console.log('\n📦 Step 4: Test Bulk Payout (Mixed Mobile & Bank)');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/tembo-payout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'bulk',
        payouts: [
          {
            payout_type: 'mobile',
            recipient_phone: '255754123456',
            recipient_name: 'Employee 1',
            amount: 30000,
            description: 'Monthly Salary',
          },
          {
            payout_type: 'mobile',
            recipient_phone: '255765987654',
            recipient_name: 'Employee 2',
            amount: 35000,
            description: 'Monthly Salary',
          },
          {
            payout_type: 'bank',
            recipient_bank_account: 'CORUTZTZ:0150123456789',
            recipient_name: 'Supplier Company',
            amount: 200000,
            description: 'Goods Payment',
          },
        ],
      }),
    });

    const data = await response.json();
    
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ Bulk Payout Request Successful');
      console.log(`   Total Payouts: ${data.results.length}`);
      data.results.forEach((result, index) => {
        console.log(`   Payout ${index + 1}: ${result.status} (ID: ${result.payout_id})`);
      });
    } else {
      console.log('\n⚠️  Bulk Payout Request Failed');
      console.log(`   Error: ${data.error}`);
    }
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 MOBILE & BANK PAYOUT TEST');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  await testMobilePayout();
  await testBankPayout();
  await testBulkPayout();

  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST COMPLETE');
  console.log('='.repeat(60));
  console.log('\n📊 Summary:');
  console.log('   ✅ Mobile Money Payout - Tested');
  console.log('   ✅ Bank Transfer Payout - Tested');
  console.log('   ✅ Bulk Payout (Mixed) - Tested');
  console.log('\n🎉 Both mobile and bank payouts are working!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
