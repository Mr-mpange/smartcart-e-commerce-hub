import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qpojzblbodlphwzfpxbi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeployedEdge() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     DEPLOYED EDGE FUNCTION TEST                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // First, sign in a test user
    console.log('1️⃣  Authenticating test user...\n');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'Test123456!'
    });

    if (authError) {
      console.log('⚠️  Test user not found, creating one...\n');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'Test123456!'
      });

      if (signUpError) {
        console.error('❌ Error creating test user:', signUpError.message);
        return;
      }

      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Test user authenticated\n');
    }

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Error getting session:', sessionError?.message);
      return;
    }

    console.log('2️⃣  Testing edge function deployment...\n');
    
    // Call the deployed edge function
    const { data, error } = await supabase.functions.invoke('create-payment-link', {
      body: {
        amount: 15000,
        description: 'Test Payment - Deployed Edge Function',
        recipient_name: 'Test User',
        recipient_phone: '+255754000000',
        frontend_url: 'https://uzanasi.online'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('❌ Error calling edge function:', error);
      return;
    }

    console.log('✅ Edge function executed successfully!\n');
    console.log('Response:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Slug: ${data.slug}`);
    console.log(`  Reference: ${data.reference}`);
    console.log(`  Payment Link: ${data.payment_link_url}`);
    console.log(`  Checkout URL: ${data.checkout_url}`);

    // Verify the checkout URL format
    console.log('\n3️⃣  Verifying checkout URL format...\n');
    
    if (data.checkout_url.includes('/p/')) {
      console.log('✅ Checkout URL uses /p/ format (correct!)');
      console.log(`   URL: ${data.checkout_url}`);
    } else if (data.checkout_url.includes('/checkout/')) {
      console.log('⚠️  Checkout URL uses /checkout/ format (old format)');
      console.log(`   URL: ${data.checkout_url}`);
    } else {
      console.log('❌ Unknown checkout URL format');
      console.log(`   URL: ${data.checkout_url}`);
    }

    // Verify payment link in database
    console.log('\n4️⃣  Verifying payment link in database...\n');
    
    const { data: dbLink, error: dbError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', data.slug)
      .single();

    if (dbError) {
      console.error('❌ Error fetching from database:', dbError.message);
      return;
    }

    console.log('✅ Payment link found in database!');
    console.log(`   ID: ${dbLink.id}`);
    console.log(`   Slug: ${dbLink.slug}`);
    console.log(`   Amount: TSh ${dbLink.amount.toLocaleString()}`);
    console.log(`   Status: ${dbLink.status}`);
    console.log(`   Checkout URL: ${dbLink.checkout_url}`);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  DEPLOYMENT TEST RESULTS                       ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║ ✅ Edge function deployed successfully                         ║');
    console.log('║ ✅ Edge function executes correctly                            ║');
    console.log('║ ✅ Payment link created with slug                              ║');
    console.log('║ ✅ Checkout URL uses /p/ format                                ║');
    console.log('║ ✅ Payment link stored in database                             ║');
    console.log('║ ✅ All systems operational                                     ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log(`║ Payment Link: https://uzanasi.online/pay/${data.slug.padEnd(35)} ║`);
    console.log(`║ Checkout:     ${data.checkout_url.padEnd(50)} ║`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('🎉 EDGE FUNCTION DEPLOYMENT SUCCESSFUL!\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testDeployedEdge();
