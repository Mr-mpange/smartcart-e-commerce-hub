#!/usr/bin/env node

// Test Tembo API balance to check account status
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';
const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';

async function checkBalance() {
  console.log('\n' + '='.repeat(60));
  console.log('💰 CHECK TEMBO ACCOUNT BALANCE');
  console.log('='.repeat(60));

  try {
    const requestId = crypto.randomUUID();

    console.log(`\n🔑 Account ID: ${TEMBO_ACCOUNT_ID}`);
    console.log(`🔑 Request ID: ${requestId}`);

    // Check disbursement balance
    console.log(`\n📊 Checking Disbursement Balance...`);
    const balanceResponse = await fetch(`${TEMBO_API_URL}/wallet/disbursement-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify({}),
    });

    const balanceData = await balanceResponse.json();
    console.log(`Status: ${balanceResponse.status}`);
    console.log(`Response:`, JSON.stringify(balanceData, null, 2));

    if (balanceResponse.ok) {
      console.log(`\n✅ Disbursement Balance:`);
      console.log(`   Account No: ${balanceData.accountNo}`);
      console.log(`   Balance: ${balanceData.balance}`);
      console.log(`   Currency: ${balanceData.currency}`);
    }

    // Check collection balance
    console.log(`\n📊 Checking Collection Balance...`);
    const collectionResponse = await fetch(`${TEMBO_API_URL}/wallet/collection-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify({}),
    });

    const collectionData = await collectionResponse.json();
    console.log(`Status: ${collectionResponse.status}`);
    console.log(`Response:`, JSON.stringify(collectionData, null, 2));

    if (collectionResponse.ok) {
      console.log(`\n✅ Collection Balance:`);
      console.log(`   Account No: ${collectionData.accountNo}`);
      console.log(`   Balance: ${collectionData.balance}`);
      console.log(`   Currency: ${collectionData.currency}`);
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkBalance();
