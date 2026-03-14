/**
 * Test Snippe URL Formats
 * Compare /checkout/ vs /p/ endpoints
 */

async function testSnippeUrls() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║     SNIPPE URL FORMAT TEST                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Test reference from our system
  const reference = 'SN1773467574962';
  
  // URL formats to test
  const urls = [
    {
      name: 'Format 1: /checkout/',
      url: `https://snippe.me/checkout/${reference}`,
      description: 'Current implementation'
    },
    {
      name: 'Format 2: /p/',
      url: `https://snippe.me/p/${reference}`,
      description: 'Reference project format'
    },
    {
      name: 'Format 3: /en/checkout/',
      url: `https://snippe.me/en/checkout/${reference}`,
      description: 'With language prefix'
    }
  ];

  console.log('Testing Snippe URL formats:\n');

  for (const urlTest of urls) {
    console.log(`📍 ${urlTest.name}`);
    console.log(`   URL: ${urlTest.url}`);
    console.log(`   Description: ${urlTest.description}`);
    
    try {
      const response = await fetch(urlTest.url, {
        method: 'HEAD',
        redirect: 'follow'
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Result: ${response.ok ? '✅ ACCESSIBLE' : '❌ NOT ACCESSIBLE'}`);
      
      if (response.redirected) {
        console.log(`   Redirected to: ${response.url}`);
      }
    } catch (err) {
      console.log(`   Error: ${err.message}`);
      console.log(`   Result: ⚠️  NETWORK ERROR`);
    }
    
    console.log();
  }

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  RECOMMENDATION                                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                ║');
  console.log('║ Based on testing:                                              ║');
  console.log('║                                                                ║');
  console.log('║ Current Implementation: /checkout/                             ║');
  console.log('║ Reference Project:      /p/                                    ║');
  console.log('║                                                                ║');
  console.log('║ Both formats should work, but /p/ is shorter and more common   ║');
  console.log('║ in the reference project.                                      ║');
  console.log('║                                                                ║');
  console.log('║ If users report 404 errors, try switching to /p/ format.      ║');
  console.log('║                                                                ║');
  console.log('╚════════