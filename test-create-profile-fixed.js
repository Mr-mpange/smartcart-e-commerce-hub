#!/usr/bin/env node

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';
const USER_ID = '08db2417-a500-4c06-a5cd-b82f0b73baba';

async function createProfile() {
  console.log('\n📝 Creating User Profile');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: USER_ID,
          full_name: 'Test User',
          role: 'vendor',
        })
      }
    );

    const data = await response.json();
    
    if (response.ok || response.status === 201) {
      console.log('✅ Profile created successfully');
      console.log(`   ID: ${USER_ID}`);
      console.log(`   Role: vendor`);
      console.log(`   Name: Test User`);
      return true;
    } else {
      console.log('Response:', data);
      if (data.message && data.message.includes('duplicate')) {
        console.log('✅ Profile already exists');
        return true;
      }
      throw new Error(data.message || 'Failed to create profile');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

async function run() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 CREATE USER PROFILE');
  console.log('='.repeat(60));

  const success = await createProfile();
  
  if (success) {
    console.log('\n✅ Profile ready!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Refresh your browser');
    console.log('   2. Open: http://localhost:5173/');
    console.log('   3. Login with: kilindosaid771@gmail.com / 11111111');
    console.log('   4. You should see the Vendor Dashboard');
    console.log('   5. Look for "Payment Collection" section');
    console.log('   6. Click "Create Payment Link"');
  }
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
