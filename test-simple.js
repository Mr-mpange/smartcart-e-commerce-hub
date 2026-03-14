/**
 * Simple test to check payment_links table structure
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing payment_links table...\n');
  
  try {
    // Try to fetch one payment link
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ payment_links table exists');
      console.log('\nTable columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        console.log(`  - ${col}: ${typeof data[0][col]}`);
      });
      
      // Check for new columns
      console.log('\n✅ Checking for new columns:');
      console.log(`  - slug: ${data[0].slug ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - views: ${data[0].views !== undefined ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - payments_count: ${data[0].payments_count !== undefined ? '✅ EXISTS' : '❌ MISSING'}`);
      console.log(`  - total_collected: ${data[0].total_collected !== undefined ? '✅ EXISTS' : '❌ MISSING'}`);
    } else {
      console.log('✅ payment_links table exists (empty)');
      console.log('\nNo payment links found. Creating test link...\n');
      
      // Try to create a test link
      const { data: newLink, error: createError } = await supabase
        .from('payment_links')
        .insert({
          slug: 'test1234',
          amount: 10000,
          description: 'Test Link',
          status: 'active',
          snippe_reference: 'SN_TEST_' + Date.now(),
          views: 0,
          payments_count: 0,
          total_collected: 0
        })
        .select();
      
      if (createError) {
        console.error('❌ Error creating test link:', createError.message);
        console.error('Details:', createError);
      } else {
        console.log('✅ Test link created successfully!');
        console.log('Link:', newLink?.[0]);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
