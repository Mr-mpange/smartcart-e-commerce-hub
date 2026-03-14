// @ts-ignore - Deno resolves npm imports at runtime
import { createClient } from 'npm:@supabase/supabase-js@2';

// @ts-ignore - Deno is a global runtime
declare const Deno: any;

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
      return await handleSendPayout(body, user, adminClient, SUPABASE_URL);
    } else if (action === 'bulk') {
      return await handleBulkPayout(body, user, adminClient, SUPABASE_URL);
    } else if (action === 'approve') {
      return await handleApprovePayout(body, user, adminClient, SUPABASE_URL);
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

async function handleSendPayout(body: any, user: any, adminClient: any, supabaseUrl: string) {
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

  // Generate payout ID
  const payoutId = crypto.randomUUID();

  if (needsApproval) {
    return new Response(JSON.stringify({
      success: true,
      payout_id: payoutId,
      status: 'pending_approval',
      message: `Payout of TZS ${amount.toLocaleString()} requires admin approval`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  // Process immediately
  const result = await processTemboPayment(payoutId, recipient_phone, amount, description || 'SmartCart Payout', adminClient, wallet_id, supabaseUrl);
  return new Response(JSON.stringify(result), { status: result.success ? 200 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleBulkPayout(body: any, user: any, adminClient: any, supabaseUrl: string) {
  const { payouts: payoutList } = body;

  if (!Array.isArray(payoutList) || payoutList.length === 0) {
    return new Response(JSON.stringify({ error: 'payouts array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const results: any[] = [];
  for (const p of payoutList) {
    const needsApproval = p.amount >= PAYOUT_APPROVAL_THRESHOLD;
    const payoutId = crypto.randomUUID();

    if (!needsApproval) {
      const result = await processTemboPayment(payoutId, p.recipient_phone, p.amount, p.description || 'SmartCart Bulk Payout', adminClient, p.wallet_id, supabaseUrl);
      results.push({ ...result, payout_id: payoutId });
    } else {
      results.push({ payout_id: payoutId, status: 'pending_approval' });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleApprovePayout(body: any, user: any, adminClient: any, supabaseUrl: string) {
  const { payout_id } = body;
  return new Response(JSON.stringify({ success: true, status: 'approved', message: 'Payout approved' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function handleRejectPayout(body: any, user: any, adminClient: any) {
  const { payout_id, reason } = body;
  return new Response(JSON.stringify({ success: true, status: 'rejected' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

async function processTemboPayment(payoutId: string, phone: string, amount: number, description: string, adminClient: any, walletId?: string, supabaseUrl?: string) {
  try {
    // Format phone
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = '255' + formattedPhone.substring(1);
    if (!formattedPhone.startsWith('255')) formattedPhone = '255' + formattedPhone;

    // Get Tembo credentials from environment
    // @ts-ignore
    const TEMBO_ACCOUNT_ID = Deno.env.get('TEMBO_ACCOUNT_ID');
    // @ts-ignore
    const TEMBO_SECRET = Deno.env.get('TEMBO_SECRET');
    // @ts-ignore
    const TEMBO_API_URL = Deno.env.get('TEMBO_API_URL') || 'https://api.temboplus.com/tembo/v1';
    // @ts-ignore
    const SUPABASE_URL = supabaseUrl || Deno.env.get('SUPABASE_URL');

    if (!TEMBO_ACCOUNT_ID || !TEMBO_SECRET) {
      throw new Error('Tembo credentials not configured');
    }

    try {
      console.log('Calling Tembo Payout API...')
      
      const requestId = crypto.randomUUID()
      
      // Get disbursement account number first (from balance endpoint)
      const balanceResponse = await fetch(`${TEMBO_API_URL}/wallet/disbursement-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({}),
      })

      let disbursementAccountNo = '9000911192' // fallback
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        disbursementAccountNo = balanceData.accountNo || disbursementAccountNo
      }

      // Determine service code based on phone number prefix
      let serviceCode = 'TZ-AIRTEL-B2C'
      if (formattedPhone.startsWith('255065') || formattedPhone.startsWith('255071')) {
        serviceCode = 'TZ-TIGO-B2C'
      } else if (formattedPhone.startsWith('255062')) {
        serviceCode = 'TZ-HALOTEL-B2C'
      } else if (formattedPhone.startsWith('255074') || formattedPhone.startsWith('255075')) {
        serviceCode = 'TZ-VODACOM-B2C'
      }

      const payoutPayload = {
        countryCode: 'TZ',
        accountNo: disbursementAccountNo,
        serviceCode: serviceCode,
        amount: Math.round(amount),
        msisdn: formattedPhone,
        narration: description || 'SmartCart Payout',
        currencyCode: 'TZS',
        recipientNames: 'Recipient',
        transactionRef: payoutId,
        transactionDate: new Date().toISOString(),
        callbackUrl: `${SUPABASE_URL}/functions/v1/tembo-webhook`,
      }

      console.log('Payout payload:', JSON.stringify(payoutPayload, null, 2))

      const response = await fetch(`${TEMBO_API_URL}/payment/wallet-to-mobile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify(payoutPayload),
      })

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        // Deduct from wallet if specified
        if (walletId) {
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
          // @ts-ignore
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
        return { success: false, payout_id: payoutId, error: 'Tembo payout failed', details: data };
      }
    } catch (err) {
      console.error('Process payout error:', err);
      return { success: false, payout_id: payoutId, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  } catch (err) {
    console.error('Process payout outer error:', err);
    return { success: false, payout_id: payoutId, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
