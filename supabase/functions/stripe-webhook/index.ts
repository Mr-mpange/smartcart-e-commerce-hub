// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2';

// @ts-ignore
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!STRIPE_WEBHOOK_SECRET) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Get request body
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify Stripe signature
    // Note: In production, use proper Stripe signature verification
    // For now, we'll accept the webhook
    console.log('Received Stripe webhook');

    const event = JSON.parse(body);
    console.log('Event type:', event.type);

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Handle different event types
    if (event.type === 'payment_intent.succeeded') {
      return await handlePaymentSuccess(event, adminClient);
    } else if (event.type === 'charge.refunded') {
      return await handleRefund(event, adminClient);
    } else if (event.type === 'charge.dispute.created') {
      return await handleDispute(event, adminClient);
    } else {
      console.log('Unhandled event type:', event.type);
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePaymentSuccess(event: any, adminClient: any) {
  try {
    const paymentIntent = event.data.object;
    const amount = paymentIntent.amount / 100; // Convert from cents to currency units
    const userId = paymentIntent.metadata?.user_id;
    const description = paymentIntent.description || 'Stripe payment';

    if (!userId) {
      console.error('No user_id in payment metadata');
      return new Response(JSON.stringify({ error: 'No user_id in metadata' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing payment: ${amount} for user ${userId}`);

    // Get or create wallet
    let { data: wallet } = await adminClient.from('wallets').select('*').eq('user_id', userId).single();

    if (!wallet) {
      const { data: newWallet } = await adminClient
        .from('wallets')
        .insert({ user_id: userId, balance: 0, currency: 'TZS' })
        .select()
        .single();
      wallet = newWallet;
    }

    // Add funds to wallet
    const newBalance = (wallet.balance || 0) + amount;
    const { error: updateError } = await adminClient
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await adminClient.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'deposit',
      amount: amount,
      source: 'stripe',
      reference_id: paymentIntent.id,
      status: 'completed',
      description: description,
    });

    if (txError) throw txError;

    console.log(`✅ Payment processed: ${amount} added to wallet for user ${userId}`);

    return new Response(JSON.stringify({ success: true, amount, userId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling payment success:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleRefund(event: any, adminClient: any) {
  try {
    const charge = event.data.object;
    const amount = charge.amount_refunded / 100;
    const originalPaymentId = charge.payment_intent;

    console.log(`Processing refund: ${amount} for payment ${originalPaymentId}`);

    // Find wallet transaction
    const { data: transaction } = await adminClient
      .from('wallet_transactions')
      .select('wallet_id')
      .eq('reference_id', originalPaymentId)
      .single();

    if (!transaction) {
      console.error('Original transaction not found');
      return new Response(JSON.stringify({ error: 'Original transaction not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get wallet
    const { data: wallet } = await adminClient.from('wallets').select('*').eq('id', transaction.wallet_id).single();

    // Deduct refund amount
    const newBalance = Math.max(0, (wallet.balance || 0) - amount);
    await adminClient.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

    // Record refund transaction
    await adminClient.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: amount,
      source: 'stripe',
      reference_id: charge.id,
      status: 'completed',
      description: `Refund for payment ${originalPaymentId}`,
    });

    console.log(`✅ Refund processed: ${amount} deducted from wallet`);

    return new Response(JSON.stringify({ success: true, amount }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling refund:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleDispute(event: any, adminClient: any) {
  try {
    const dispute = event.data.object;
    console.log(`Dispute created: ${dispute.id} for charge ${dispute.charge}`);

    // Log dispute for review
    await adminClient.from('disputes').insert({
      stripe_dispute_id: dispute.id,
      charge_id: dispute.charge,
      amount: dispute.amount / 100,
      reason: dispute.reason,
      status: dispute.status,
      evidence_due_by: dispute.evidence_due_by,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error handling dispute:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
