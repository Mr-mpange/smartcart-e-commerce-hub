#!/usr/bin/env node

const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';

async function testAuthMethods() {
  console.log('\n' + '='.repeat(70));
  console.log('🔐 TEMBO AUTHENTICATION METHODS TEST');
  console.log('='.repeat(70));

  const requestId = '550e8400-e29b-41d4-a716-446655440000';

  // Test 1: Try to get auth token first
  console.log('\n📍 Test 1: Try to Get Auth Token');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        account_id: TEMBO_ACCOUNT_ID,
        secret: TEMBO_SECRET,
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 2: Try login endpoint
  console.log('\n📍 Test 2: Try Login Endpoint');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        account_id: TEMBO_ACCOUNT_ID,
        secret: TEMBO_SECRET,
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 3: Try authenticate endpoint
  console.log('\n📍 Test 3: Try Authenticate Endpoint');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/authenticate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify({
        account_id: TEMBO_ACCOUNT_ID,
        secret: TEMBO_SECRET,
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 4: Try with just account_id as Bearer token
  console.log('\n📍 Test 4: Account ID as Bearer Token');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'Authorization': `Bearer ${TEMBO_ACCOUNT_ID}`,
      },
      body: JSON.stringify({
        phone: '255754123456',
        amount: 5000,
        reference: 'TEST-001',
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 5: Try with secret as Bearer token
  console.log('\n📍 Test 5: Secret as Bearer Token');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/payment/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': requestId,
        'Authorization': `Bearer ${TEMBO_SECRET}`,
      },
      body: JSON.stringify({
        phone: '255754123456',
        amount: 5000,
        reference: 'TEST-001',
      }),
    });
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }

  // Test 6: Check available endpoints
  console.log('\n📍 Test 6: Check Root Endpoint');
  console.log('─'.repeat(70));
  try {
    const response = await fetch(`${TEMBO_API_URL}/`, {
      method: 'GET',
      headers: {
        'x-request-id': requestId,
      },
    });
    const text = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response (first 500 chars): ${text.substring(0, 500)}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
}

testAuthMethods().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
