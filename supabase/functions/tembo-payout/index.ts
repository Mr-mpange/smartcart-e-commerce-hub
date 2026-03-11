import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PAYOUT_APPROVAL_THRESHOLD = 500000; // TZS 500,000 requires approval

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TEMBO_API_KEY = Deno.env.get('TEMBO_API_KEY');
    if (!TEMBO_API_KEY) throw new Error('TEMBO_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json();
    const { action } = body;

    // Handle different actions
    if (action === 'send') {
      return await handleSendPayout(body, user, adminClient, TEMBO_API_KEY);
    } else if (action === 'bulk') {
      return await handleBulkPayout(body, user, adminClient, TEMBO_API_KEY);
    } else if (action === 'approve') {
      return await handleApprovePayout(body, user, adminClient, TEMBO_API_KEY);
    } else if (action === 'reject') {
      return await handleRejectPayout(body, user, adminClient);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action. Use: send, bulk, approve, reject' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  } catch (error) {
    console.error('Payout error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

async function handleSendPayout(body: any, user: any, adminClient: any, apiKey: string) {
  const { recipient_phone, recipient_name, amount, description, wallet_id } = body;

  if (!recipient_phone || !amount || amount <= 0) {
    return new Response(JSON.stringify({ error: 'recipient_phone and valid amount required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const needsApproval = amount >= PAYOUT_APPROVAL_THRESHOLD;

  // If using internal wallet, check balance
  if (wallet_id) {
    const { data: wallet } = await adminClient.from('wallets').select('balance').eq('id', wallet_id).single();
    if (!wallet || wallet.balance < amount) {
      return new Response(JSON.stringify({ error: 'Insufficient wallet balance' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  }

  // Create payout record
  const { data: payout, error: insertError } = await adminClient.from('payouts').insert({
    requested_by: user.id,
    recipient_phone,
    recipient_name: recipient_name || null,
    amount,
    payout_type: 'single',
    status: needsApproval ? 'pending_approval' : 'processing',
    approval_required: needsApproval,
    description: description || null,
    wallet_id: wallet_id || null,
  }).select().single();

  if (insertError) {
    console.error('Insert error:', insertError);
    return new Response(JSON.stringify({ error: 'Failed to create payout record' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  if (needsApproval) {
    return new Response(JSON.stringify({
      success: true,
      payout_id: payout.id,
      status: 'pending_approval',
      message: `Payout of TZS ${amount.toLocaleString()} requires admin approval`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Process immediately
  const result = await processTemboPayment(payout.id, recipient_phone, amount, description || 'SmartCart Payout', apiKey, adminClient, wallet_id);
  return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleBulkPayout(body: any, user: any, adminClient: any, apiKey: string) {
  const { payouts: payoutList } = body;

  if (!Array.isArray(payoutList) || payoutList.length === 0) {
    return new Response(JSON.stringify({ error: 'payouts array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const results = [];
  for (const p of payoutList) {
    const needsApproval = p.amount >= PAYOUT_APPROVAL_THRESHOLD;
    const { data: payout } = await adminClient.from('payouts').insert({
      requested_by: user.id,
      recipient_phone: p.recipient_phone,
      recipient_name: p.recipient_name || null,
      amount: p.amount,
      payout_type: 'bulk',
      status: needsApproval ? 'pending_approval' : 'processing',
      approval_required: needsApproval,
      description: p.description || 'Bulk payout',
      wallet_id: p.wallet_id || null,
    }).select().single();

    if (payout && !needsApproval) {
      const result = await processTemboPayment(payout.id, p.recipient_phone, p.amount, p.description || 'SmartCart Bulk Payout', apiKey, adminClient, p.wallet_id);
      results.push({ ...result, payout_id: payout.id });
    } else if (payout) {
      results.push({ payout_id: payout.id, status: 'pending_approval' });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleApprovePayout(body: any, user: any, adminClient: any, apiKey: string) {
  const { payout_id } = body;

  // Check admin role
  const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Only admins can approve payouts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const { data: payout } = await adminClient.from('payouts').select('*').eq('id', payout_id).eq('status', 'pending_approval').single();
  if (!payout) {
    return new Response(JSON.stringify({ error: 'Payout not found or not pending approval' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  await adminClient.from('payouts').update({ approved_by: user.id, approved_at: new Date().toISOString(), status: 'processing' }).eq('id', payout_id);

  const result = await processTemboPayment(payout_id, payout.recipient_phone, payout.amount, payout.description || 'Approved payout', apiKey, adminClient, payout.wallet_id);
  return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleRejectPayout(body: any, user: any, adminClient: any) {
  const { payout_id, reason } = body;

  const { data: isAdmin } = await adminClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'Only admins can reject payouts' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  await adminClient.from('payouts').update({
    status: 'rejected',
    rejected_by: user.id,
    rejected_at: new Date().toISOString(),
    rejection_reason: reason || 'Rejected by admin',
  }).eq('id', payout_id);

  return new Response(JSON.stringify({ success: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function processTemboPayment(payoutId: string, phone: string, amount: number, description: string, apiKey: string, adminClient: any, walletId?: string) {
  try {
    // Format phone
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '255' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('255')) formattedPhone = '255' + formattedPhone;

    // Call Tembo API
    const response = await fetch('https://sandbox.temboplus.com/v1/disbursements', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: formattedPhone,
        amount: Math.round(amount),
        description,
        reference: payoutId,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Deduct from wallet if specified
      if (walletId) {
        await adminClient.from('wallets').update({ balance: adminClient.rpc('balance_minus', { amount }) }).eq('id', walletId);
        // Simpler approach: raw update
        const { data: wallet } = await adminClient.from('wallets').select('balance').eq('id', walletId).single();
        if (wallet) {
          await adminClient.from('wallets').update({ balance: wallet.balance - amount }).eq('id', walletId);
          await adminClient.from('wallet_transactions').insert({
            wallet_id: walletId,
            type: 'withdrawal',
            amount,
            description: `Payout to ${phone}`,
            reference_id: payoutId,
          });
        }
      }

      await adminClient.from('payouts').update({
        status: 'completed',
        tembo_reference: data.reference || data.id || null,
      }).eq('id', payoutId);

      // Ledger entry
      await adminClient.from('ledger_entries').insert({
        transaction_type: 'payout',
        amount,
        receiver_name: phone,
        reference: data.reference || payoutId,
        reference_id: payoutId,
        status: 'completed',
        description,
      });

      // Send SMS confirmation
      try {
        const BRIQ_API_KEY = Deno.env.get('BRIQ_API_KEY');
        if (BRIQ_API_KEY) {
          await fetch('https://api.briq.tz/v1/sms/send', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${BRIQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: `+${formattedPhone}`,
              message: `SmartCart: Payout of TZS ${amount.toLocaleString()} sent to your account. Ref: ${payoutId.slice(0, 8).toUpperCase()}`,
              sender_id: 'SmartCart',
            }),
          });
        }
      } catch (smsErr) {
        console.error('SMS error (non-fatal):', smsErr);
      }

      return { success: true, payout_id: payoutId, status: 'completed', tembo_reference: data.reference || data.id };
    } else {
      console.error('Tembo API error:', JSON.stringify(data));
      await adminClient.from('payouts').update({ status: 'failed', metadata: { error: data } }).eq('id', payoutId);
      return { success: false, payout_id: payoutId, error: 'Tembo payout failed', details: data };
    }
  } catch (err) {
    console.error('Process payout error:', err);
    await adminClient.from('payouts').update({ status: 'failed' }).eq('id', payoutId);
    return { success: false, payout_id: payoutId, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
