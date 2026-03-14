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

async function testTemboAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEMBO API FINAL TEST - Correct Authentication');
  console.log('='.repeat(70));

  // Test 1: Collection/Initiate with unique request ID
  console.log('\n📍 Test 1: Initiate USSD Collection');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/collection/initiate`, {
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
        callbackUrl: 'https://uzanasi.online/api/tembo-webhook',
      }),
    });
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    try {
      const data = JSON.parse(text);
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
    } catch (e) {
      console.log(`Response (HTML): ${text.substring(0, 200)}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 2: Collection/Balance
  console.log('\n📍 Test 2: Get Collection Balance');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/collection/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 3: Payout/Send with unique request ID
  console.log('\n📍 Test 3: Send Payout');
  console.log('─'.repeat(70));
  try {
    const requestId = generateUUID();
    const response = await fetch(`${TEMBO_API_URL}/payout/send`, {
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
        transactionRef: `PAYOUT-${Date.now()}`,
        description: 'Test Payout',
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 4: Check available endpoints
  console.log('\n📍 Test 4: List Available Endpoints');
  console.log('─'.repeat(70));
  const endpoints = [
    '/collection/initiate',
    '/collection/balance',
    '/collection/statement',
    '/collection/status',
    '/payout/send',
    '/payout/status',
  ];

  for (const endpoint of endpoints) {
    try {
      const requestId = generateUUID();
      const response = await fetch(`${TEMBO_API_URL}${endpoint}`, {
        method: 'OPTIONS',
        headers: {
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
      });
      console.log(`  ${endpoint}: ${response.status}`);
    } catch (err) {
      console.log(`  ${endpoint}: Error - ${err.message}`);
    }
  }
}

testTemboAPI().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
