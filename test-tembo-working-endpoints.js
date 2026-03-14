#!/usr/bin/env node

// Test the endpoints we know work from previous tests
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';
const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';

async function testEndpoint(path, name, payload = {}) {
  try {
    const requestId = crypto.randomUUID();
    
    console.log(`\n📍 Testing: ${name}`);
    console.log(`   Endpoint: POST ${path}`);
    console.log(`   Request ID: ${requestId}`);

    const response = await fetch(`${TEMBO_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    });

    console.log(`   Status: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`   Response:`, JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log(`   ✅ SUCCESS`);
        return data;
      } else {
        console.log(`   ❌ FAILED`);
      }
    } else {
      const text = await response.text();
      console.log(`   Content-Type: ${contentType}`);
      console.log(`   Response: ${text.substring(0, 150)}`);
      console.log(`   ❌ FAILED`);
    }
    
    return null;
  } catch (err) {
    console.log(`   ❌ ERROR: ${err.message}`);
    return null;
  }
}

async function run() {
  console.log('\n' + '='.repeat(80));
  console.log('💰 TEMBO ACCOUNT BALANCE - WORKING ENDPOINTS');
  console.log('='.repeat(80));

  console.log(`\n🔑 Account ID: ${TEMBO_ACCOUNT_ID}`);
  console.log(`📍 API URL: ${TEMBO_API_URL}`);

  // These are the endpoints mentioned in the Tembo documentation
  const endpoints = [
    { path: '/wallet/collection-balance', name: 'Collection Balance' },
    { path: '/wallet/collection-statement', name: 'Collection Statement', payload: { startDate: '2026-01-01', endDate: '2026-03-14' } },
    { path: '/collection/status', name: 'Collection Status' },
    { path: '/payment/wallet-to-mobile', name: 'Wallet to Mobile (Test)', payload: { 
      countryCode: 'TZ',
      accountNo: '9000911192',
      serviceCode: 'TZ-AIRTEL-B2C',
      amount: 100,
      msisdn: '255683859574',
      narration: 'Test',
      currencyCode: 'TZS',
      recipientNames: 'Test',
      transactionRef: 'TEST-' + Date.now(),
      transactionDate: new Date().toISOString(),
    }},
  ];

  for (const endpoint of endpoints) {
    await testEndpoint(endpoint.path, endpoint.name, endpoint.payload || {});
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ ENDPOINT TEST COMPLETE');
  console.log(`${'='.repeat(80)}\n`);
}

run();
