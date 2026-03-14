/**
 * Find Payment Link Slug
 * This script finds the slug for a payment link by its Snippe reference
 */

const supabaseUrl = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI2NzI5NzcsImV4cCI6MjAxODI0ODk3N30.Ej-Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0Ej0';

async function findPaymentLink(snippeReference) {
  try {
    console.log(`\n🔍 Searching for payment link with reference: ${snippeReference}\n`);

    const url = `${supabaseUrl}/rest/v1/payment_links?snippe_reference=eq.${snippeReference}&select=id,slug,snippe_reference,amount,status,created_at,views,payments_count,total_collected`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`❌ Error: HTTP ${response.status}`);
      const error = await response.text();
      console.error('Error details:', error);
      return null;
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error('❌ Payment link not found');
      return null;
    }

    const link = data[0];

    console.log('✅ Payment Link Found!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID:                 ${link.id}`);
    console.log(`Slug:               ${link.slug}`);
    console.log(`Snippe Reference:   ${link.snippe_reference}`);
    console.log(`Amount:             TSh ${link.amount.toLocaleString()}`);
    console.log(`Status:             ${link.status}`);
    console.log(`Created:            ${new Date(link.created_at).toLocaleString()}`);
    console.log(`Views:              ${link.views}`);
    console.log(`Payments:           ${link.payments_count}`);
    console.log(`Total Collected:    TSh ${link.total_collected.toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📤 SHAREABLE LINK:\n');
    console.log(`🔗 https://uzanasi.online/pay/${link.slug}\n`);

    console.log('💬 SHARE OPTIONS:\n');
    console.log(`📱 SMS: Pay here: https://uzanasi.online/pay/${link.slug}`);
    console.log(`💬 WhatsApp: https://wa.me/?text=Pay%20here:%20https://uzanasi.online/pay/${link.slug}`);
    console.log(`📲 QR Code: Scan to open https://uzanasi.online/pay/${link.slug}\n`);

    console.log('🧪 TEST LINK:\n');
    console.log(`http://localhost:5173/pay/${link.slug}\n`);

    return link;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Run the search
const snippeReference = process.argv[2] || 'SN17734693211441088';
findPaymentLink(snippeReference);
