// @ts-ignore - Supabase Edge Runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

// Deno global declarations for Edge Runtime
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Your order #ORDER_ID has been received.',
  confirmed: 'Your order #ORDER_ID has been confirmed.',
  processing: 'Your order #ORDER_ID is being processed.',
  shipped: 'Your order #ORDER_ID has been shipped!',
  out_for_delivery: 'Your order #ORDER_ID is out for delivery!',
  delivered: 'Your order #ORDER_ID has been delivered. Thank you!',
  cancelled: 'Your order #ORDER_ID has been cancelled.',
};

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Format phone number to international format
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  } else if (!cleaned.startsWith('255') && cleaned.length === 9) {
    cleaned = '255' + cleaned;
  }
  return '+' + cleaned;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const BRIQ_API_KEY = Deno.env.get('BRIQ_API_KEY');
    if (!BRIQ_API_KEY) {
      console.error('BRIQ_API_KEY is not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'SMS service not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const body = await req.json();
    console.log('SMS request:', JSON.stringify(body));

    let phoneNumber: string;
    let message: string;

    // Handle OTP generation and sending
    if (body.action === 'generate_otp' && body.email) {
      console.log('=== OTP GENERATION START ===');
      console.log('Email:', body.email);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Instead of using admin API, look up user profile directly by email
      // This requires that we have the email stored in the profiles table
      console.log('Looking up user profile by email...');
      
      // First, try to find profile by checking auth.users table with service role
      let profile = null;
      let userId = null;
      
      try {
        // Try to get user by email using RPC function or direct query
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, phone')
          .limit(100); // Get all profiles to search through
        
        if (profileError) {
          console.error('Profile lookup error:', profileError);
          throw profileError;
        }
        
        console.log('Found profiles count:', profiles?.length || 0);
        
        // Now check which profile belongs to the user with this email
        if (profiles && profiles.length > 0) {
          for (const prof of profiles) {
            try {
              // Check if this profile ID corresponds to a user with the given email
              const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(prof.id);
              
              if (authUser && authUser.user && authUser.user.email === body.email) {
                profile = prof;
                userId = prof.id;
                console.log('Found matching profile for email:', body.email);
                break;
              }
            } catch (userCheckError) {
              // Skip this profile if we can't check the user
              continue;
            }
          }
        }
        
        if (!profile) {
          console.log('No profile found for email:', body.email);
          return new Response(
            JSON.stringify({ success: false, error: 'User profile not found for this email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
      } catch (lookupError) {
        console.error('User lookup failed:', lookupError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to lookup user profile', debug: lookupError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      if (!profile.phone) {
        console.log('No phone number for user');
        return new Response(
          JSON.stringify({ success: false, error: 'No phone number registered for this account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      
      console.log('Generated OTP:', otp);
      console.log('Expires at:', expiresAt);

      // Store OTP in database with email for easier lookup
      console.log('Storing OTP in database...');
      const { error: otpError } = await supabase
        .from('login_otps')
        .insert([{
          phone_number: formatPhoneNumber(profile.phone),
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
          user_email: body.email, // Store email for easier verification lookup
        }]);

      if (otpError) {
        console.error('OTP storage error:', otpError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate OTP', debug: otpError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('OTP stored successfully');
      phoneNumber = formatPhoneNumber(profile.phone);
      message = `Your SmartCart login OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;
      
      console.log('Phone number:', phoneNumber);
      console.log('Message:', message);
    }
    // Handle OTP verification
    else if (body.action === 'verify_otp' && body.email && body.otp_code) {
      console.log('=== OTP VERIFICATION START ===');
      console.log('Email:', body.email);
      console.log('OTP Code:', body.otp_code);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      console.log('Supabase URL:', supabaseUrl);
      console.log('Service Key exists:', !!supabaseServiceKey);
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      try {
        // Look up OTP record by email and code directly
        console.log('Querying login_otps table...');
        const { data: otpRecords, error: otpError } = await supabase
          .from('login_otps')
          .select('*')
          .eq('user_email', body.email)
          .eq('otp_code', body.otp_code)
          .eq('is_used', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1);

        console.log('Query result - data:', otpRecords);
        console.log('Query result - error:', otpError);

        if (otpError || !otpRecords || otpRecords.length === 0) {
          console.log('OTP verification failed - no valid record found');
          
          // Try to increment attempts
          try {
            await supabase
              .from('login_otps')
              .update({ attempts: 1 }) // Simple increment instead of SQL function
              .eq('user_email', body.email)
              .eq('otp_code', body.otp_code);
          } catch (updateError) {
            console.log('Failed to increment attempts:', updateError);
          }

          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Invalid or expired OTP',
              debug: {
                otpError: otpError?.message,
                hasRecord: !!otpRecord
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        const otpRecord = otpRecords[0];
        console.log('Valid OTP record found, marking as used...');

        // Mark OTP as used
        const { error: updateError } = await supabase
          .from('login_otps')
          .update({ is_used: true })
          .eq('id', otpRecord.id);

        if (updateError) {
          console.error('Failed to mark OTP as used:', updateError);
        } else {
          console.log('OTP marked as used successfully');
        }

        console.log('=== OTP VERIFICATION SUCCESS ===');
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'OTP verified successfully',
            phone_number: otpRecord.phone_number
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      } catch (verificationError) {
        console.error('OTP verification exception:', verificationError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'OTP verification failed',
            debug: verificationError.message
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }
    // Handle order notifications
    else if (body.order_id && body.status) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: order } = await supabase
        .from('orders')
        .select('id, phone_number')
        .eq('id', body.order_id)
        .single();

      if (!order) {
        return new Response(
          JSON.stringify({ success: false, error: 'Order not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      phoneNumber = body.phone_number || order.phone_number;
      const shortOrderId = order.id.slice(0, 8).toUpperCase();
      message = (STATUS_MESSAGES[body.status] || 'Your order status has been updated.')
        .replace('ORDER_ID', shortOrderId);
    }
    // Handle direct SMS
    else if (body.phone_number && body.message) {
      phoneNumber = body.phone_number;
      message = body.message;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request. Use action: generate_otp/verify_otp, or provide order_id+status, or phone_number+message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Format phone number
    let cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '255' + cleaned.slice(1);
    } else if (!cleaned.startsWith('255') && cleaned.length === 9) {
      cleaned = '255' + cleaned;
    }
    const formattedPhone = '+' + cleaned;

    console.log(`Sending SMS to ${formattedPhone}: ${message}`);
    console.log('BRIQ_API_KEY configured:', BRIQ_API_KEY ? 'Yes (length: ' + BRIQ_API_KEY.length + ')' : 'No');

    // Check if this is an OTP request - send our generated OTP via SMS
    if (body.action === 'generate_otp') {
      console.log('Sending OTP via SMS API...');
      console.log('Using message with OTP:', message);
      
      // Use direct SMS API instead of OTP API so we can send our own OTP
      let briqResponse;
      let isNewAPI = true;
      
      try {
        // Use the new Karibu Messages API to send our generated OTP
        briqResponse = await fetch('https://karibu.briq.tz/v1/message/send-instant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': BRIQ_API_KEY,
          },
          body: JSON.stringify({
            content: message, // This contains our generated OTP
            recipients: [formattedPhone],
            sender_id: 'BRIQ',
          }),
        });
      } catch (newAPIError) {
        console.log('New API failed, trying old API:', newAPIError);
        isNewAPI = false;
        
        // Fallback to old API
        briqResponse = await fetch('https://api.briq.tz/v1/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BRIQ_API_KEY}`,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message, // This contains our generated OTP
            sender_id: 'SmartCart',
          }),
        });
      }

      let briqResult;
      const responseText = await briqResponse.text();
      console.log(`Briq ${isNewAPI ? 'new' : 'old'} API raw response:`, responseText);
      
      try {
        briqResult = JSON.parse(responseText);
        console.log(`Briq ${isNewAPI ? 'new' : 'old'} API parsed response:`, JSON.stringify(briqResult));
      } catch (parseError) {
        console.error('Failed to parse Briq response as JSON:', parseError);
        console.log('Response was likely HTML error page');
        
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Briq API returned HTML error page. Check API key and endpoint.',
              details: responseText.substring(0, 200) + '...'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid response from Briq API',
            details: responseText.substring(0, 200) + '...'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!briqResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: briqResult?.message || 'SMS failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Return success for OTP generation
      console.log('=== OTP GENERATION SUCCESS ===');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent to your phone',
          expires_in: 300, // 5 minutes in seconds
          briq_response: briqResult,
          api_used: isNewAPI ? 'karibu' : 'legacy'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // For direct SMS, try the new Karibu Messages API first, fallback to old API
      let briqResponse;
      let isNewAPI = true;
      
      try {
      // For direct SMS, use the new Karibu Messages API
      briqResponse = await fetch('https://karibu.briq.tz/v1/message/send-instant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BRIQ_API_KEY,
        },
        body: JSON.stringify({
          content: message,
          recipients: [formattedPhone],
          sender_id: 'BRIQ', // Use BRIQ as sender_id for SMS
        }),
      });
      } catch (newAPIError) {
        console.log('New API failed, trying old API:', newAPIError);
        isNewAPI = false;
        
        // Fallback to old API
        briqResponse = await fetch('https://api.briq.tz/v1/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${BRIQ_API_KEY}`,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            message: message,
            sender_id: 'SmartCart',
          }),
        });
      }

      let briqResult;
      const responseText = await briqResponse.text();
      console.log(`Briq ${isNewAPI ? 'new' : 'old'} API raw response:`, responseText);
      
      try {
        briqResult = JSON.parse(responseText);
        console.log(`Briq ${isNewAPI ? 'new' : 'old'} API parsed response:`, JSON.stringify(briqResult));
      } catch (parseError) {
        console.error('Failed to parse Briq response as JSON:', parseError);
        console.log('Response was likely HTML error page');
        
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Briq API returned HTML error page. Check API key and endpoint.',
              details: responseText.substring(0, 200) + '...'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid response from Briq API',
            details: responseText.substring(0, 200) + '...'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!briqResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: briqResult?.message || 'SMS failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'SMS sent', 
          details: briqResult,
          api_used: isNewAPI ? 'karibu' : 'legacy'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
