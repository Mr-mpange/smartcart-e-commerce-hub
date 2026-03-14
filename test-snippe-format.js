/**
 * Test Snippe URL Formats
 */

async function testUrls() {
  console.log('\n🔗 SNIPPE URL FORMAT TEST\n');

  const reference = 'SN1773467574962';
  
  const urls = [
    { name: '/checkout/', url: `https://snippe.me/checkout/${reference}` },
    { name: '/p/', url: `https://snippe.me/p/${reference}` },
    { name: '/en/checkout/', url: `https://snippe.me/en/checkout/${reference}` }
  ];

  for (const test of urls) {
    console.log(`Testing: ${test.name}`);
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await fetch(test.url, { method: 'HEAD' });
      console.log(`Status: ${response.status} - ${response.ok ? '✅ OK' : '❌ ERROR'}\n`);
    } catch (err) {
      console.log(`Error: ${err.message}\n`);
    }
  }

  console.log('RECOMMENDATION:');
  console.log('- Current: /checkout/ format');
  console.log('- Reference: /p/ format');
  console.log('- Both should work, but /p/ is shorter\n');
}

tes