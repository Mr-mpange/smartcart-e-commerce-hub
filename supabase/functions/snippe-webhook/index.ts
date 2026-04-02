// @ts-ignore
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// @ts-ignore
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Snippe webhook received:', JSON.stringify(payload));

    // @ts-ignore
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    // @ts-ignore
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract from Snippe webhook format
    const eventType = payload.type; // payment.completed or payment.failed
    const paymentData = payload.data;
    const metadata = paymentData?.metadata || {};
    const status = paymentData?.status;
    const reference = paymentData?.reference;

    console.log(`Snippe webhook: event=${eventType}, reference=${reference}, status=${status}, metadata=${JSON.stringify(metadata)}`);

    // Check if this is a payment link (shareable link) or an order
    const paymentLinkId = metadata?.payment_link_id;
    const orderId = metadata?.order_id;

    if (eventType === 'payment.completed' && status === 'completed') {
      // Handle payment link completion
      if (paymentLinkId) {
        console.log(`Payment completed for payment link: ${paymentLinkId}`);
        
        const { data: paymentLink, error: linkError } = await supabase
          .from('payment_links')
          .select('id, amount, payments_count, total_collected')
          .eq('id', paymentLinkId)
          .single();

        if (linkError || !paymentLink) {
          console.error('Payment link not found:', linkError);
        } else {
          // Update payment link status and stats
          const { error: updateError } = await supabase
            .from('payment_links')
            .update({
              status: 'paid',
              payments_count: (paymentLink.payments_count || 0) + 1,
              total_collected: (paymentLink.total_collected || 0) + paymentLink.amount
            })
            .eq('id', paymentLinkId);

          if (updateError) {
            console.error('Failed to update payment link:', updateError);
          } else {
            console.log(`Payment link ${paymentLinkId} marked as paid`);
          }
        }
      }
      // Handle order completion
      else if (orderId) {
        console.log(`Payment completed for order: ${orderId}`);
        
        // Fetch the order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, phone_number, status, total_amount')
          .eq('id', orderId)
          .single();

        if (orderError || !order) {
          console.error('Order not found:', orderError);
        } else {
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
        }
      } else {
        console.warn('No payment_link_id or order_id found in webhook metadata');
      }
    } else if (eventType === 'payment.failed') {
      console.log(`Payment failed: reference=${reference}, reason=${paymentData?.failure_reason || 'Unknown reason'}`);
      
      if (paymentLinkId) {
        await supabase
          .from('payment_links')
          .update({ status: 'failed' })
          .eq('id', paymentLinkId);
      } else if (orderId) {
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('id', orderId);
      }
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
