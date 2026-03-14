#!/usr/bin/env node

const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg';

async function checkDatabase() {
  console.log('\n📋 Checking Latest Payment Links in Database');
  console.log('─'.repeat(60));
  
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/payment_links?order=created_at.desc&limit=3&select=id,slug,amount,snippe_reference,checkout_url,status,created_at`,
      {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log(`\n✅ Found ${data.length} payment links:\n`);
      
      data.forEach((link, index) => {
        console.log(`Link ${index + 1}:`);
        console.log(`  ID: ${link.id}`);
        console.log(`  Slug: ${link.slug || '❌ MISSING'}`);
        console.log(`  Amount: TSh ${link.amount}`);
        console.log(`  Reference: ${link.snippe_reference}`);
        console.log(`  Checkout URL: ${link.checkout_url}`);
        console.log(`  Status: ${link.status}`);
        console.log(`  Created: ${link.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ Error:', data);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkDatabase();
