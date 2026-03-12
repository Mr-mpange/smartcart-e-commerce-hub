import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Please sign in to make payments' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SNIPPE_API_KEY = Deno.env.get('SNIPPE_API_KEY');
    if (!SNIPPE_API_KEY) {
      console.error('SNIPPE_API_KEY environment variable is not configured');
      return new Response(
        JSON.stringify({ error: 'Payment service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { order_id, buyer_name, buyer_email, buyer_phone, amount } = await req.json();

    if (!order_id || !buyer_phone || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, buyer_phone, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format phone number - remove leading + and ensure 255 prefix
    let phone = buyer_phone.replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '255' + phone.substring(1);
    }

    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/snippe-webhook`;

    // Split name into first/last
    const nameParts = (buyer_name || 'Customer').split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    const paymentPayload = {
      payment_type: 'mobile',
      details: {
        amount: Math.round(amount),
        currency: 'TZS',
      },
      phone_number: phone,
      customer: {
        firstname: firstName,
        lastname: lastName,
        email: buyer_email || 'customer@smartcart.co.tz',
      },
      webhook_url: webhookUrl,
      metadata: {
        order_id: order_id,
      },
    };

    console.log('Snippe payment request:', JSON.stringify(paymentPayload));

    const response = await fetch('https://api.snippe.sh/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SNIPPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `order-${order_id}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Snippe API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: 'Payment request failed', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Snippe payment created:', JSON.stringify(data));

    return new Response(
      JSON.stringify({
        success: true,
        reference: data.data?.reference,
        status: data.data?.status,
        data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing Snippe payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
