#!/usr/bin/env node

/**
 * Complete Payment Link System Test
 * Tests the entire flow from login to payment link creation and access
 */

const BASE_URL = 'http://localhost:5173';
const API_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';

const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

console.log('🚀 Starting Complete Payment Link System Test\n');
console.log('📋 Test Configuration:');
console.log(`   Base URL: ${BASE_URL}`);
console.log(`   API URL: ${API_URL}`);
console.log(`   Test Email: ${TEST_EMAIL}`);
console.log(`   Test Password: ${TEST_PASSWORD}\n`);

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function testLogin() {
  console.log('\n📝 TEST 1: Login\n');
  
  try {
    const response = await fetch(`${API_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
    });

    const data = await response.json();
    
    if (response.ok && data.access_token) {
      logTest('Login successful', true, `User ID: ${data.user.id}`);
      return data.access_token;
    } else {
      logTest('Login failed', false, data.error_descript