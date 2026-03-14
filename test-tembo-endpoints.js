#!/usr/bin/env node

// Test different Tembo endpoints to find working ones
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';
const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';

const endpoints = [
  { method: 'POST', path: '/wallet/balance', name: 'Wallet Balance' },
  { method: 'POST', path: '/account/balance', name: 'Account Balance' },
  { method: 'GET', path: '/wallet/balance', name: 'Wallet Balance (GET)' },
  { method: 'POST', path: '/collection/balance', name: 'Collection Balance' },
  { method: 'POST', path: '/disbursement/balance', name: 'Disbursement Balance' },
  { method: 'POST', path: '/account/info', name: 'Account Info' },
  { method: 'POST', path: '/wallet/info', name: 'Wallet Info' },
  { method: 'POST', path: '/collection/status', name: 'Collection Status' },
];

async function testEndpoint(method, path, name) {
  try {
    const requestId = crypto.randomUUID();
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
    };

    if (method === 'POST') {
      options.body = JSON.stringify({});
    }

    const response = await fetch(`${TEMBO_API_URL}${path}`, options);
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
      data = data.substring(0, 100);
    }

    const status = response.ok ? '✅' : '❌';
    console.log(`${status} ${method.padEnd(4)} ${path.padEnd(35)} [${response.status}]`);
    
    if (response.ok && typeof data === 'object') {
      console.log(`   └─ ${JSON.stringify(data).substring(0, 80)}`);
    }
    
    return response.ok;
  } catch (err) {
    console.log(`❌ ${method.padEnd(4)} ${path.padEnd(35)} [ERROR]`);
    console.log(`   └─ ${err.message.substring(0, 80)}`);
    return false;
  }
}

async function run() {
  console.log('\n' + '='.repeat(80));
  console.log('🔍 TEMBO API ENDPOINT DISCOVERY');
  console.log('='.repeat(80));

  console.log(`\n🔑 Account: ${TEMBO_ACCOUNT_ID}`);
  console.log(`📍 Base URL: ${TEMBO_API_URL}\n`);

  console.log('Testing endpoints...\n');

  let successCount = 0;
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.method, endpoint.path, endpoint.name);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Results: ${successCount}/${endpoints.length} endpoints working`);
  console.log(`${'='.repeat(80)}\n`);
}

run();
