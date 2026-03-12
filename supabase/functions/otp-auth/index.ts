// @ts-ignore - Supabase Edge Runtime import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';
import type { CorsHeaders, OTPRequest, OTPResponse } from '../_shared/types.ts';

const corsHeaders: CorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, phone_number, email, otp_code } = await req.json();

    if (action === 'generate') {
      // Generate and send OTP
      if (!email) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email is required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Check if user exists with this email
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(email);
      
      if (authError || !authUser.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found with this email' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, phone')
        .eq('id', authUser.user.id)
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

      // Use the phone number from profile
      const formattedPhone = formatPhoneNumber(profile.phone);

      // Generate OTP
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      // Store OTP in database
      const { error: otpError } = await supabaseClient
        .from('login_otps')
        .insert([{
          phone_number: formattedPhone,
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

      // Send OTP via Briq SMS
      const BRIQ_API_KEY = Deno.env.get('BRIQ_API_KEY');
      if (!BRIQ_API_KEY) {
        return new Response(
          JSON.stringify({ success: false, error: 'SMS service not configured' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const message = `Your SmartCart login OTP is: ${otp}. Valid for 5 minutes. Do not share this code.`;

      const briqResponse = await fetch('https://api.briq.tz/v1/sms/send', {
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

      const briqResult = await briqResponse.json();
      console.log('Briq SMS response:', briqResult);

      if (!briqResponse.ok) {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send OTP SMS' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP sent to your phone',
          expires_in: 300 // 5 minutes in seconds
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'verify') {
      // Verify OTP
      if (!email || !otp_code) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email and OTP code are required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Get user by email first
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserByEmail(email);
      
      if (authError || !authUser.user) {
        return new Response(
          JSON.stringify({ success: false, error: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Get user's phone number
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('phone')
        .eq('id', authUser.user.id)
        .single();

      if (profileError || !profile?.phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'User phone number not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      const formattedPhone = formatPhoneNumber(profile.phone);

      // Find valid OTP
      const { data: otpRecord, error: otpError } = await supabaseClient
        .from('login_otps')
        .select('*')
        .eq('phone_number', formattedPhone)
        .eq('otp_code', otp_code)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        // Increment attempts for this phone/OTP combination
        await supabaseClient
          .from('login_otps')
          .update({ attempts: supabaseClient.sql`attempts + 1` })
          .eq('phone_number', formattedPhone)
          .eq('otp_code', otp_code);

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid or expired OTP' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Mark OTP as used
      await supabaseClient
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

    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action. Use "generate" or "verify"' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

  } catch (error: any) {
    console.error('OTP Auth Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});