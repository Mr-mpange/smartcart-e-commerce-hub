#!/usr/bin/env node

// Check Tembo account balance
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';
const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';

async function checkAllBalances() {
  console.log('\n' + '='.repeat(70));
  console.log('💰 TEMBO ACCOUNT BALANCE CHECK');
  console.log('='.repeat(70));

  console.log(`\n🔑 Account ID: ${TEMBO_ACCOUNT_ID}`);
  console.log(`📍 API URL: ${TEMBO_API_URL}`);

  try {
    const requestId = crypto.randomUUID();

    // Test 1: Disbursement Balance
    console.log(`\n${'─'.repeat(70)}`);
    console.log('1️⃣  DISBURSEMENT BALANCE (For Payouts)');
    console.log(`${'─'.repeat(70)}`);

    try {
      const disbResponse = await fetch(`${TEMBO_API_URL}/wallet/disbursement-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({}),
      });

      console.log(`Status Code: ${disbResponse.status}`);
      
      const contentType = disbResponse.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        const disbData = await disbResponse.json();
        console.log(`Response:`, JSON.stringify(disbData, null, 2));
        
        if (disbResponse.ok) {
          console.log(`\n✅ Disbursement Wallet:`);
          console.log(`   Account Number: ${disbData.accountNo || 'N/A'}`);
          console.log(`   Balance: ${disbData.balance || disbData.availableBalance || 'N/A'} ${disbData.currency || 'TZS'}`);
          console.log(`   Status: ${disbData.status || 'Active'}`);
        }
      } else {
        const text = await disbResponse.text();
        console.log(`⚠️  Response is not JSON (${contentType})`);
        console.log(`First 200 chars: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }

    // Test 2: Collection Balance
    console.log(`\n${'─'.repeat(70)}`);
    console.log('2️⃣  COLLECTION BALANCE (For Receiving Payments)');
    console.log(`${'─'.repeat(70)}`);

    try {
      const collResponse = await fetch(`${TEMBO_API_URL}/wallet/collection-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({}),
      });

      console.log(`Status Code: ${collResponse.status}`);
      
      const contentType = collResponse.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        const collData = await collResponse.json();
        console.log(`Response:`, JSON.stringify(collData, null, 2));
        
        if (collResponse.ok) {
          console.log(`\n✅ Collection Wallet:`);
          console.log(`   Account Number: ${collData.accountNo || 'N/A'}`);
          console.log(`   Balance: ${collData.balance || collData.availableBalance || 'N/A'} ${collData.currency || 'TZS'}`);
          console.log(`   Status: ${collData.status || 'Active'}`);
        }
      } else {
        const text = await collResponse.text();
        console.log(`⚠️  Response is not JSON (${contentType})`);
        console.log(`First 200 chars: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }

    // Test 3: Collection Statement
    console.log(`\n${'─'.repeat(70)}`);
    console.log('3️⃣  COLLECTION STATEMENT (Transaction History)');
    console.log(`${'─'.repeat(70)}`);

    try {
      const stmtResponse = await fetch(`${TEMBO_API_URL}/wallet/collection-statement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        }),
      });

      console.log(`Status Code: ${stmtResponse.status}`);
      
      const contentType = stmtResponse.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);

      if (contentType && contentType.includes('application/json')) {
        const stmtData = await stmtResponse.json();
        console.log(`Response:`, JSON.stringify(stmtData, null, 2));
        
        if (stmtResponse.ok && stmtData.transactions) {
          console.log(`\n✅ Recent Transactions: ${stmtData.transactions.length}`);
          stmtData.transactions.slice(0, 5).forEach((tx, i) => {
            console.log(`   ${i + 1}. ${tx.type} - ${tx.amount} ${tx.currency} (${tx.status})`);
          });
        }
      } else {
        const text = await stmtResponse.text();
        console.log(`⚠️  Response is not JSON (${contentType})`);
        console.log(`First 200 chars: ${text.substring(0, 200)}`);
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
    }

  } catch (err) {
    console.error('❌ Fatal Error:', err.message);
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('✅ BALANCE CHECK COMPLETE');
  console.log(`${'='.repeat(70)}\n`);
}

checkAllBalances();
