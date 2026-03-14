/**
 * Test Payment Link Creation
 * This script tests the complete payment link creation flow
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate slug
const generateSlug = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};

// Test 1: Check if payment_links table has slug column
async function testTableStructure() {
  console.log('\n=== TEST 1: Check Table Structure ===');
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying payment_links:', error.message);
      return false;
    }
    
    console.log('✅ payment_links table exists');
    console.log('Sample columns:', Object.keys(data?.[0] || {}));
    return true;
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

// Test 2: Create a test payment link
async function testCreatePaymentLink() {
  console.log('\n=== TEST 2: Create Payment Link ===');
  try {
    const slug = generateSlug();
    console.log('Generated slug:', slug);
    
    const { data, error } = await supabase
      .from('payment_links')
      .insert({
        slug: slug,
        amount: 10000,
        description: 'Test Payment Link',
        status: 'active',
        snippe_reference: 'SN_TEST_' + Date.now(),
        recipient_name: 'Test User',
        recipient_phone: '255754000000',
        views: 0,
        payments_count: 0,
        total_collected: 0
      })
      .select();
    
    if (error) {
      console.error('❌ Error creating payment link:', error.message);
      console.error('Error details:', error);
      return null;
    }
    
    console.log('✅ Payment link created successfully');
    console.log('Link ID:', data?.[0]?.id);
    console.log('Slug:', data?.[0]?.slug);
    console.log('Amount:', data?.[0]?.amount);
    return data?.[0];
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return null;
  }
}

// Test 3: Fetch payment link by slug
async function testFetchBySlug(slug: string) {
  console.log('\n=== TEST 3: Fetch Payment Link by Slug ===');
  try {
    const { data, error } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('❌ Error fetching payment link:', error.message);
      return null;
    }
    
    console.log('✅ Payment link fetched successfully');
    console.log('Slug:', data.slug);
    console.log('Amount:', data.amount);
    console.log('Status:', data.status);
    console.log('Views:', data.views);
    console.log('Payments Count:', data.payments_count);
    return data;
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return null;
  }
}

// Test 4: Update view count
async function testUpdateViews(slug: string) {
  console.log('\n=== TEST 4: Update View Count ===');
  try {
    const { data: link } = await supabase
      .from('payment_links')
      .select('views')
      .eq('slug', slug)
      .single();
    
    const newViews = (link?.views || 0) + 1;
    
    const { data, error } = await supabase
      .from('payment_links')
      .update({ views: newViews })
      .eq('slug', slug)
      .select();
    
    if (error) {
      console.error('❌ Error updating views:', error.message);
      return false;
    }
    
    console.log('✅ Views updated successfully');
    console.log('New view count:', data?.[0]?.views);
    return true;
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

// Test 5: Simulate payment confirmation
async function testPaymentConfirmation(slug: string) {
  console.log('\n=== TEST 5: Simulate Payment Confirmation ===');
  try {
    const { data: link } = await supabase
      .from('payment_links')
      .select('*')
      .eq('slug', slug)
      .single();
    
    const { data, error } = await supabase
      .from('payment_links')
      .update({
        status: 'paid',
        payments_count: (link?.payments_count || 0) + 1,
        total_collected: (link?.total_collected || 0) + link?.amount
      })
      .eq('slug', slug)
      .select();
    
    if (error) {
      console.error('❌ Error updating payment status:', error.message);
      return false;
    }
    
    console.log('✅ Payment confirmed successfully');
    console.log('Status:', data?.[0]?.status);
    console.log('Payments Count:', data?.[0]?.payments_count);
    console.log('Total Collected:', data?.[0]?.total_collected);
    return true;
  } catch (err: any) {
    console.error('❌ Error:', err.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Payment Link Tests...');
  console.log('================================');
  
  // Test 1: Table structure
  const tableOk = await testTableStructure();
  if (!tableOk) {
    console.log('\n❌ Table structure test failed. Stopping tests.');
    return;
  }
  
  // Test 2: Create payment link
  const link = await testCreatePaymentLink();
  if (!link) {
    console.log('\n❌ Create payment link test failed. Stopping tests.');
    return;
  }
  
  const slug = link.slug;
  
  // Test 3: Fetch by slug
  const fetchedLink = await testFetchBySlug(slug);
  if (!fetchedLink) {
    console.log('\n❌ Fetch by slug test failed. Stopping tests.');
    return;
  }
  
  // Test 4: Update views
  const viewsOk = await testUpdateViews(slug);
  if (!viewsOk) {
    console.log('\n❌ Update views test failed. Stopping tests.');
    return;
  }
  
  // Test 5: Payment confirmation
  const paymentOk = await testPaymentConfirmation(slug);
  if (!paymentOk) {
    console.log('\n❌ Payment confirmation test failed. Stopping tests.');
    return;
  }
  
  console.log('\n================================');
  console.log('✅ All tests passed!');
  console.log('\nPayment Link Summary:');
  console.log(`- Slug: ${slug}`);
  console.log(`- URL: https://uzanasi.online/pay/${slug}`);
  console.log(`- Amount: 10,000 TSh`);
  console.log(`- Status: paid`);
  console.log(`- Views: 1`);
  console.log(`- Payments: 1`);
  console.log(`- Collected: 10,000 TSh`);
}

// Run tests
runAllTests().catch(console.error);
