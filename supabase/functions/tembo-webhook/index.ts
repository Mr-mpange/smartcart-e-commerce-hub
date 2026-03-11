import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload = await req.json();
    console.log('Tembo webhook payload:', JSON.stringify(payload));

    const reference = payload.reference || payload.data?.reference;
    const status = payload.status || payload.data?.status;

    if (!reference) {
      return new Response(JSON.stringify({ received: true, warning: 'No reference found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Find payout by tembo_reference or id
    const { data: payout } = await supabase.from('payouts')
      .select('*')
      .or(`tembo_reference.eq.${reference},id.eq.${reference}`)
      .single();

    if (!payout) {
      console.warn('Payout not found for reference:', reference);
      return new Response(JSON.stringify({ received: true, warning: 'Payout not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const isSuccess = status === 'completed' || status === 'successful' || status === 'success';
    const isFailed = status === 'failed' || status === 'rejected';

    if (isSuccess && payout.status !== 'completed') {
      await supabase.from('payouts').update({ status: 'completed' }).eq('id', payout.id);
      await supabase.from('ledger_entries').update({ status: 'completed' }).eq('reference_id', payout.id);
    } else if (isFailed && payout.status !== 'failed') {
      await supabase.from('payouts').update({ status: 'failed' }).eq('id', payout.id);
      await supabase.from('ledger_entries').update({ status: 'failed' }).eq('reference_id', payout.id);

      // Refund wallet if applicable
      if (payout.wallet_id) {
        const { data: wallet } = await supabase.from('wallets').select('balance').eq('id', payout.wallet_id).single();
        if (wallet) {
          await supabase.from('wallets').update({ balance: wallet.balance + payout.amount }).eq('id', payout.wallet_id);
          await supabase.from('wallet_transactions').insert({
            wallet_id: payout.wallet_id,
            type: 'refund',
            amount: payout.amount,
            description: `Payout refund - failed disbursement`,
            reference_id: payout.id,
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Tembo webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
