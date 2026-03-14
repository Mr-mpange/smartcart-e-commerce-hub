#!/usr/bin/env node

const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function testCorrectEndpoints() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEMBO API - CORRECT ENDPOINTS TEST');
  console.log('='.repeat(70));

  // Test 1: Wallet Collection Balance (from documentation)
  console.log('\n📍 Test 1: Get Collection Wallet Balance');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/wallet/collection-balance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify({}),
    });
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    try {
      const data = JSON.parse(text);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`Response: ${text.substring(0, 300)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 2: Collection Status
  console.log('\n📍 Test 2: Get Collection Transaction Status');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/collection/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        transactionId: 'TEST-001',
        transactionRef: 'TEST-001',
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 3: Wallet Collection Statement
  console.log('\n📍 Test 3: Get Collection Wallet Statement');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/wallet/collection-statement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        startDate: '2026-01-01',
        endDate: '2026-03-14',
      }),
    });
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    try {
      const data = JSON.parse(text);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`Response: ${text.substring(0, 300)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 4: Try different payout paths
  console.log('\n📍 Test 4: Try Different Payout Endpoints');
  console.log('─'.repeat(70));
  const payoutEndpoints = [
    '/payout/send',
    '/wallet/payout',
    '/disbursement/send',
    '/transfer/send',
  ];

  for (const endpoint of payoutEndpoints) {
    try {
      const requestId = generateUUID();
      const response = await fetch(`${TEMBO_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          phoneNumber: '255754123456',
          amount: 5000,
          transactionRef: `TEST-${Date.now()}`,
        }),
      });
      const text = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        responseData = text.substring(0, 100);
      }
      console.log(`  ${endpoint}: ${response.status} - ${JSON.stringify(responseData).substring(0, 100)}`);
    } catch (err) {
      console.log(`  ${endpoint}: Error - ${err.message}`);
    }
  }

  // Test 5: Try different collection initiate paths
  console.log('\n📍 Test 5: Try Different Collection Initiate Endpoints');
  console.log('─'.repeat(70));
  const initiateEndpoints = [
    '/collection/initiate',
    '/momo/initiate',
    '/ussd/initiate',
    '/wallet/collection-initiate',
    '/collection/request',
  ];

  for (const endpoint of initiateEndpoints) {
    try {
      const requestId = generateUUID();
      const response = await fetch(`${TEMBO_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({
          phoneNumber: '255754123456',
          amount: 5000,
          transactionRef: `TEST-${Date.now()}`,
          channel: 'TZ-AIRTEL-C2B',
        }),
      });
      const text = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(text);
      } catch (e) {
        responseData = text.substring(0, 100);
      }
      console.log(`  ${endpoint}: ${response.status} - ${JSON.stringify(responseData).substring(0, 100)}`);
    } catch (err) {
      console.log(`  ${endpoint}: Error - ${err.message}`);
    }
  }
}

testCorrectEndpoints().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
