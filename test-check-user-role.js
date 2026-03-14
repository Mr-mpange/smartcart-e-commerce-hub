#!/usr/bin/env node

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const TEST_EMAIL = 'kilindosaid771@gmail.com';
const TEST_PASSWORD = '11111111';

let sessionToken = null;
let userId = null;

async function login() {
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
    userId = data.user.id;
    console.log('✅ Login successful');
    console.log(`   User ID: ${userId}`);
    return true;
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return false;
  }
}

async function checkUserProfile() {
  console.log('\n📋 Checking User Profile');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      const profile = data[0];
      console.log('\n✅ User Profile Found:');
      console.log(`   ID: ${profile.id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Role: ${profile.role || 'NOT SET'}`);
      console.log(`   Full Name: ${profile.full_name || 'N/A'}`);
      console.log(`   Avatar: ${profile.avatar_url || 'N/A'}`);
      
      return profile;
    } else {
      console.log('❌ No profile found');
      return null;
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return null;
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 CHECK USER ROLE');
  console.log('='.repeat(60));

  if (!await login()) {
    process.exit(1);
  }

  const profile = await checkUserProfile();
  
  if (profile) {
    console.log('\n📝 Dashboard Access:');
    const role = profile.role?.toLowerCase();
    
    if (role === 'vendor') {
      console.log('   → Go to: http://localhost:5173/vendor-dashboard');
      console.log('   → Payment Monitoring should be visible');
    } else if (role === 'rider') {
      console.log('   → Go to: http://localhost:5173/rider-dashboard');
      console.log('   → Payment Monitoring should be visible');
    } else if (role === 'reseller') {
      console.log('   → Go to: http://localhost:5173/reseller-dashboard');
      console.log('   → Payment Monitoring should be visible');
    } else if (role === 'admin') {
      console.log('   → Go to: http://localhost:5173/admin');
      console.log('   → Click "payments" tab');
      console.log('   → Payment Monitoring should be visible');
    } else {
      console.log(`   ⚠️  Role is: ${role || 'NOT SET'}`);
      console.log('   → Try: http://localhost:5173/');
    }
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
