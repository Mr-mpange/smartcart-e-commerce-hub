import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (body.order_id && body.status) {
      // Order notification
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
    } else if (body.phone_number && body.message) {
      phoneNumber = body.phone_number;
      message = body.message;
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request' }),
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

    // Send via Briq API
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
    console.log('Briq response:', JSON.stringify(briqResult));

    if (!briqResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: briqResult.message || 'SMS failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'SMS sent', details: briqResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
