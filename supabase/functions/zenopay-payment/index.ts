import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { order_id, buyer_email, buyer_name, buyer_phone, amount } = await req.json();

    const ZENOPAY_API_KEY = Deno.env.get('ZENOPAY_API_KEY');
    
    if (!ZENOPAY_API_KEY) {
      throw new Error('ZenoPay API key not configured');
    }

    // Validate required fields
    if (!order_id || !buyer_email || !buyer_name || !buyer_phone || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create webhook URL for payment status callbacks
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/zenopay-webhook`;

    // Make payment request to ZenoPay
    const response = await fetch('https://api.zenopay.africa/v1/mobile_money_tanzania', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ZENOPAY_API_KEY,
      },
      body: JSON.stringify({
        order_id,
        buyer_email,
        buyer_name,
        buyer_phone,
        amount,
        webhook_url: webhookUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('ZenoPay API error:', data);
      return new Response(
        JSON.stringify({ error: 'Payment request failed', details: data }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing payment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
