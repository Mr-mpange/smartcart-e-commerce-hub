// Test OTP verification directly
const SUPABASE_URL = 'https://qpojzblbodlphwzfpxbi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5MzY3ODMsImV4cCI6MjA0ODUxMjc4M30.Hs_Ej8-Ej8-Ej8-Ej8-Ej8-Ej8-Ej8-Ej8-Ej8-Ej8-Ej8';

async function testOTPVerification() {
  const email = 'kilindosaid771@gmail.com';
  const otp = '123456'; // Replace with actual OTP
  
  try {
    console.log('Testing OTP verification...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/briq-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'verify_otp',
        email: email,
        otp_code: otp
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('Success:', result);
    } else {
      console.log('Error response:', responseText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testOTPVerification();