import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('ZenoPay webhook received:', JSON.stringify(payload));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract order info from webhook payload
    const orderId = payload.order_id || payload.reference || payload.metadata?.order_id;
    const status = payload.status || payload.transaction_status;
    const isSuccess = status === 'SUCCESS' || status === 'COMPLETED' || payload.success === true;

    if (!orderId) {
      console.error('No order_id in webhook payload');
      return new Response(
        JSON.stringify({ received: true, warning: 'No order_id found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing payment for order ${orderId}, status: ${status}, success: ${isSuccess}`);

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

    if (isSuccess) {
      // Update order status to confirmed
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', orderId);

      if (updateError) {
        console.error('Failed to update order status:', updateError);
      } else {
        console.log(`Order ${orderId} status updated to confirmed`);

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
          console.error('Failed to send SMS notification:', smsError);
        }
      }
    } else {
      console.log(`Payment failed for order ${orderId}`);
    }
    
    return new Response(
      JSON.stringify({ received: true, processed: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
