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
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user by email using auth admin API
      let userId: string;
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Auth admin error:', authError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to lookup user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        const user = authData.users.find(u => u.email === body.email);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'User not found with this email' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        userId = user.id;
      } catch (adminError) {
        console.error('Admin API not available, trying direct profile lookup:', adminError);
        
        // Fallback: Since we can't query auth.users directly, we'll need to find another way
        // For now, let's assume the user exists and try to find their profile
        // This is a workaround - in production you'd want proper user lookup
        return new Response(
          JSON.stringify({ success: false, error: 'User lookup failed. Please ensure user exists and has a profile.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', userId)
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ success: false, error: 'User profile not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      if (!profile.phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'No phone number registered for this account' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      const { error: otpError } = await supabase
        .from('login_otps')
        .insert([{
          phone_number: formatPhoneNumber(profile.phone),
          otp_code: otp,
          expires_at: expiresAt.toISOString(),
        }]);

      if (otpError) {
        console.error('OTP storage error:', otpError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to generate OTP' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      phoneNumber = formatPhoneNumber(profile.phone);
      message = `Your SmartCart login OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;
    }
    // Handle OTP verification
    else if (body.action === 'verify_otp' && body.email && body.otp_code) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user by email using auth admin API
      let userId: string;
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error('Auth admin error:', authError);
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to lookup user' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        const user = authData.users.find(u => u.email === body.email);
        if (!user) {
          return new Response(
            JSON.stringify({ success: false, error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }

        userId = user.id;
      } catch (adminError) {
        console.error('Admin API not available:', adminError);
        return new Response(
          JSON.stringify({ success: false, error: 'User lookup failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Get user's phone number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'User phone number not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const formattedPhone = formatPhoneNumber(profile.phone);

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from('login_otps')
        .select('*')
        .eq('phone_number', formattedPhone)
        .eq('otp_code', body.otp_code)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        // Increment attempts for this phone/OTP combination
        await supabase
          .from('login_otps')
          .update({ attempts: supabase.sql`attempts + 1` })
          .eq('phone_number', formattedPhone)
          .eq('otp_code', body.otp_code);

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired OTP' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Mark OTP as used
      await supabase
        .from('login_otps')
        .update({ is_used: true })
        .eq('id', otpRecord.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully',
          phone_number: formattedPhone
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    // Check if this is an OTP request - use new Karibu OTP API
    if (body.action === 'generate_otp') {
      // Use Karibu OTP API endpoint
      const briqResponse = await fetch('https://karibu.briq.tz/otp/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': BRIQ_API_KEY,
        },
        body: JSON.stringify({
          phone_number: formattedPhone,
          app_key: BRIQ_API_KEY, // Using API key as app_key for now
          sender_id: 'BRIQ', // Use BRIQ as sender_id for OTP
          otp_length: 6,
          minutes_to_expire: 5,
          delivery_method: 'sms'
        }),
      });

      let briqResult;
      const responseText = await briqResponse.text();
      console.log('Briq OTP raw response:', responseText);
      
      try {
        briqResult = JSON.parse(responseText);
        console.log('Briq OTP parsed response:', JSON.stringify(briqResult));
      } catch (parseError) {
        console.error('Failed to parse Briq OTP response as JSON:', parseError);
        console.log('Response was likely HTML error page');
        
        // Check if it's an HTML error page
        if (responseText.includes('<html>') || responseText.includes('<!DOCTYPE')) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'Briq OTP API returned HTML error page. Check API key and endpoint.',
              details: responseText.substring(0, 200) + '...'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid response from Briq OTP API',
            details: responseText.substring(0, 200) + '...'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      if (!briqResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: briqResult?.message || 'OTP request failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Return success for OTP generation
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent to your phone',
          expires_in: 300, // 5 minutes in seconds
          briq_response: briqResult
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
