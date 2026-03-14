#!/usr/bin/env node

// Test Tembo API directly to see what's happening
const TEMBO_ACCOUNT_ID = '7f6ec58ab22b6a294d2c7444';
const TEMBO_SECRET = 'cr06DAcSyKSQ5qIgeZmUUbrgb2od+YIviq6gNQgzhGw=';
const TEMBO_API_URL = 'https://api.temboplus.com/tembo/v1';

async function testTemboDirectly() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 DIRECT TEMBO API TEST');
  console.log('='.repeat(60));

  try {
    const phone = '0683859574';
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '255' + formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith('255')) {
      formattedPhone = '255' + formattedPhone;
    }

    console.log(`\n📱 Original Phone: ${phone}`);
    console.log(`📱 Formatted Phone: ${formattedPhone}`);

    // Determine service code
    let serviceCode = 'TZ-AIRTEL-B2C';
    if (formattedPhone.startsWith('255065') || formattedPhone.startsWith('255071')) {
      serviceCode = 'TZ-TIGO-B2C';
    } else if (formattedPhone.startsWith('255062')) {
      serviceCode = 'TZ-HALOTEL-B2C';
    } else if (formattedPhone.startsWith('255074') || formattedPhone.startsWith('255075')) {
      serviceCode = 'TZ-VODACOM-B2C';
    }

    console.log(`📡 Service Code: ${serviceCode}`);

    const requestId = crypto.randomUUID();
    const payoutId = crypto.randomUUID();
    const amount = 1000;

    const payload = {
      countryCode: 'TZ',
      accountNo: '9000911192',
      serviceCode: serviceCode,
      amount: Math.round(amount),
      msisdn: formattedPhone,
      narration: 'Direct Test Payout',
      currencyCode: 'TZS',
      recipientNames: 'Test Recipient',
      transactionRef: payoutId,
      transactionDate: new Date().toISOString(),
      callbackUrl: 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/tembo-webhook',
    };

    console.log(`\n📤 Sending Payload:`);
    console.log(JSON.stringify(payload, null, 2));

    console.log(`\n🔑 Headers:`);
    console.log(`   x-account-id: ${TEMBO_ACCOUNT_ID}`);
    console.log(`   x-secret-key: ${TEMBO_SECRET.substring(0, 10)}...`);
    console.log(`   x-request-id: ${requestId}`);

    const response = await fetch(`${TEMBO_API_URL}/payment/wallet-to-mobile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-account-id': TEMBO_ACCOUNT_ID,
        'x-secret-key': TEMBO_SECRET,
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log(`\n📥 Response Status: ${response.status}`);
    console.log(`📥 Response Data:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.status === 'success') {
      console.log('\n✅ SUCCESS!');
      console.log(`   Reference: ${data.reference}`);
      console.log(`   Message: ${data.message}`);
    } else {
      console.log('\n❌ FAILED');
      console.log(`   Reason: ${data.reason}`);
      console.log(`   Message: ${data.message}`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testTemboDirectly();
