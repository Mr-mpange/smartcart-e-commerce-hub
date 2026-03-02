import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Snippe webhook received:', JSON.stringify(payload));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract from Snippe webhook format
    const eventType = payload.type; // payment.completed or payment.failed
    const paymentData = payload.data;
    const orderId = paymentData?.metadata?.order_id;
    const status = paymentData?.status;

    if (!orderId) {
      console.error('No order_id in Snippe webhook metadata');
      return new Response(
        JSON.stringify({ received: true, warning: 'No order_id found in metadata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Snippe webhook: event=${eventType}, order=${orderId}, status=${status}`);

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, phone_number, status, total_amount')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ received: true, warning: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (eventType === 'payment.completed' && status === 'completed') {
      // Update order status to confirmed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      } else {
        console.log(`Order ${orderId} confirmed via Snippe`);

        // Send SMS notification
        try {
          const smsResponse = await fetch(`${supabaseUrl}/functions/v1/briq-sms`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              order_id: orderId,
              status: 'confirmed',
              phone_number: order.phone_number,
            }),
          });
          const smsResult = await smsResponse.json();
          console.log('SMS notification result:', JSON.stringify(smsResult));
        } catch (smsError) {
          console.error('Failed to send SMS:', smsError);
        }
      }
    } else if (eventType === 'payment.failed') {
      console.log(`Payment failed for order ${orderId}: ${paymentData?.failure_reason || 'Unknown reason'}`);
      
      await supabase
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
    }

    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Snippe webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
