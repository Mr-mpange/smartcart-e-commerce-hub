// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const payload = await req.json()
    console.log('Top-up webhook payload:', JSON.stringify(payload))

    const reference = payload.reference || payload.data?.reference
    const status = payload.status || payload.data?.status
    const isSuccess = status === 'success' || status === 'completed'

    if (!reference) {
      console.warn('No reference in webhook payload')
      return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Find top-up by snippe_reference
    const { data: topup } = await adminClient
      .from('top_ups')
      .select('*')
      .eq('snippe_reference', reference)
      .maybeSingle()

    if (!topup) {
      console.warn('Top-up not found for reference:', reference)
      return new Response(JSON.stringify({ received: true, warning: 'Top-up not found' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('Found top-up:', topup.id)

    if (isSuccess && topup.status !== 'completed') {
      console.log('Processing successful top-up:', topup.id)

      // Get user's wallet
      const { data: wallet } = await adminClient
        .from('wallets')
        .select('id, balance')
        .eq('user_id', topup.user_id)
        .maybeSingle()

      if (wallet) {
        // Add amount to wallet
        const newBalance = wallet.balance + topup.amount
        await adminClient
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', wallet.id)

        // Record transaction
        await adminClient.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          type: 'top_up',
          amount: topup.amount,
          description: `Wallet top-up via payment link`,
          reference_id: topup.id,
        })

        console.log('Wallet updated. New balance:', newBalance)
      }

      // Update top-up status
      await adminClient
        .from('top_ups')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', topup.id)

      // Record in ledger
      await adminClient.from('ledger_entries').insert({
        transaction_type: 'top_up',
        amount: topup.amount,
        receiver_id: topup.user_id,
        receiver_name: 'Wallet Top-Up',
        reference: reference,
        reference_id: topup.id,
        status: 'completed',
        description: `Wallet top-up of TSh ${topup.amount.toLocaleString()}`,
      })

      // Send SMS confirmation
      try {
        // @ts-ignore
        const BRIQ_API_KEY = Deno.env.get('BRIQ_API_KEY')
        if (BRIQ_API_KEY) {
          const { data: user } = await adminClient
            .from('profiles')
            .select('phone')
            .eq('id', topup.user_id)
            .maybeSingle()

          if (user?.phone) {
            await fetch('https://api.briq.tz/v1/sms/send', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${BRIQ_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone: user.phone,
                message: `SmartCart: Wallet top-up of TSh ${topup.amount.toLocaleString()} completed successfully. Ref: ${reference.slice(0, 8).toUpperCase()}`,
                sender_id: 'SmartCart',
              }),
            })
          }
        }
      } catch (smsErr) {
        console.error('SMS error (non-fatal):', smsErr)
      }

      return new Response(JSON.stringify({ success: true, status: 'completed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } else if ((status === 'failed' || status === 'cancelled') && topup.status !== 'failed') {
      console.log('Top-up failed:', topup.id)

      await adminClient
        .from('top_ups')
        .update({ status: 'failed' })
        .eq('id', topup.id)

      return new Response(JSON.stringify({ success: true, status: 'failed' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error: any) {
    console.error('Top-up webhook error:', error)
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
