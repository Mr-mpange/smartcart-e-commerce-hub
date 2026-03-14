import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://qpojzblbodlphwzfpxbi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg";

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate slug
const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

async function test() {
  console.log('🚀 Testing Payment Link Creation with Auth\n');
  console.log('================================\n');
  
  try {
    // First, get current user
    console.log('1️⃣  Getting current user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('⚠️  No authenticated user. Testing with test user ID...\n');
      
      // Use a test UUID
      const testUserId = '550e8400-e29b-41d4-a716-446655440000';
      const slug = generateSlug();
      
      console.log(`2️⃣  Generated slug: ${slug}`);
      console.log(`3️⃣  Using test user ID: ${testUserId}\n`);
      
      // Create payment link with test user
      console.log('4️⃣  Creating payment link...');
      const { data, error } = await supabase
        .from('payment_links')
        .insert({
          slug: slug,
          amount: 10000,
          description: 'Test Payment Link - TSh 10,000',
          status: 'active',
          snippe_reference: 'SN_TEST_' + Date.now(),
          recipient_name: 'Test User',
          recipient_phone: '255754000000',
          created_by: testUserId,
          views: 0,
          payments_count: 0,
          total_collected: 0
        })
        .select();
      
      if (error) {
        console.error('❌ Error creating payment link:', error.message);
        console.error('Details:', error);
        return;
      }
      
      const link = data[0];
      console.log('✅ Payment link created successfully!\n');
      
      // Display link details
      console.log('5️⃣  Payment Link Details:');
      console.log(`   - ID: ${link.id}`);
      console.log(`   - Slug: ${link.slug}`);
      console.log(`   - Amount: TSh ${link.amount.toLocaleString()}`);
      console.log(`   - Description: ${link.description}`);
      console.log(`   - Status: ${link.status}`);
      console.log(`   - Reference: ${link.snippe_reference}`);
      console.log(`   - Recipient: ${link.recipient_name}`);
      console.log(`   - Phone: ${link.recipient_phone}`);
      console.log(`   - Views: ${link.views}`);
      console.log(`   - Payments: ${link.payments_count}`);
      console.log(`   - Collected: TSh ${link.total_collected}`);
      
      // Test fetching by slug
      console.log('\n6️⃣  Fetching payment link by slug...');
      const { data: fetchedLink, error: fetchError } = await supabase
        .from('payment_links')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching link:', fetchError.message);
        return;
      }
      
      console.log('✅ Payment link fetched successfully!\n');
      console.log(`   URL: https://uzanasi.online/pay/${fetchedLink.slug}`);
      console.log(`   Snippe Checkout: https://snippe.me/checkout/${fetchedLink.snippe_reference}`);
      
      // Test updating views
      console.log('\n7️⃣  Simulating page view...');
      const { data: updatedLink, error: updateError } = await supabase
        .from('payment_links')
        .update({ views: fetchedLink.views + 1 })
        .eq('slug', slug)
        .select();
      
      if (updateError) {
        console.error('❌ Error updating views:', updateError.message);
        return;
      }
      
      console.log(`✅ Views updated: ${updatedLink[0].views}`);
      
      // Test payment confirmation
      console.log('\n8️⃣  Simulating payment confirmation...');
      const { data: paidLink, error: payError } = await supabase
        .from('payment_links')
        .update({
          status: 'paid',
          payments_count: updatedLink[0].payments_count + 1,
          total_collected: updatedLink[0].total_collected + link.amount
        })
        .eq('slug', slug)
        .select();
      
      if (payError) {
        console.error('❌ Error updating payment:', payError.message);
        return;
      }
      
      console.log('✅ Payment confirmed!\n');
      console.log(`   Status: ${paidLink[0].status}`);
      console.log(`   Payments: ${paidLink[0].payments_count}`);
      console.log(`   Collected: TSh ${paidLink[0].total_collected.toLocaleString()}`);
      
      console.log('\n================================');
      console.log('✅ All tests passed!\n');
      console.log('📊 Final Payment Link Status:');
      console.log(`   - Slug: ${paidLink[0].slug}`);
      console.log(`   - URL: https://uzanasi.online/pay/${paidLink[0].slug}`);
      console.log(`   - Amount: TSh ${paidLink[0].amount.toLocaleString()}`);
      console.log(`   - Status: ${paidLink[0].status}`);
      console.log(`   - Views: ${paidLink[0].views}`);
      console.log(`   - Payments: ${paidLink[0].payments_count}`);
      console.log(`   - Collected: TSh ${paidLink[0].total_collected.toLocaleString()}`);
      console.log(`\n🎉 Payment link is ready to use!`);
      console.log(`   Visit: https://uzanasi.online/pay/${paidLink[0].slug}`);
      
    } else {
      console.log(`✅ Authenticated as: ${user.email}\n`);
      
      const slug = generateSlug();
      console.log(`2️⃣  Generated slug: ${slug}`);
      console.log(`3️⃣  User ID: ${user.id}\n`);
      
      // Create payment link with authenticated user
      console.log('4️⃣  Creating payment link...');
      const { data, error } = await supabase
        .from('payment_links')
        .insert({
          slug: slug,
          amount: 10000,
          description: 'Test Payment Link - TSh 10,000',
          status: 'active',
          snippe_reference: 'SN_TEST_' + Date.now(),
          recipient_name: 'Test User',
          recipient_phone: '255754000000',
          created_by: user.id,
          views: 0,
          payments_count: 0,
          total_collected: 0
        })
        .select();
      
      if (error) {
        console.error('❌ Error creating payment link:', error.message);
        return;
      }
      
      console.log('✅ Payment link created successfully!');
      console.log(`   URL: https://uzanasi.online/pay/${data[0].slug}`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();
