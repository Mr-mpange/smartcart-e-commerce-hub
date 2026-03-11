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
    const SNIPPE_API_KEY = Deno.env.get('SNIPPE_API_KEY');
    if (!SNIPPE_API_KEY) throw new Error('SNIPPE_API_KEY is not configured');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Auth check
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

    const { amount, description, recipient_phone, recipient_name, order_id, expires_in_hours } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create payment link record
    const linkId = crypto.randomUUID();
    const expiresAt = expires_in_hours ? new Date(Date.now() + expires_in_hours * 3600000).toISOString() : null;

    // Format phone for Snippe
    let phone = (recipient_phone || '').replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) phone = '255' + phone.substring(1);

    const webhookUrl = `${SUPABASE_URL}/functions/v1/snippe-webhook`;

    const paymentPayload = {
      payment_type: 'mobile',
      details: { amount: Math.round(amount), currency: 'TZS' },
      phone_number: phone || undefined,
      customer: {
        firstname: recipient_name?.split(' ')[0] || 'Customer',
        lastname: recipient_name?.split(' ').slice(1).join(' ') || 'User',
        email: user.email || 'customer@smartcart.co.tz',
      },
      webhook_url: webhookUrl,
      metadata: { payment_link_id: linkId, order_id: order_id || null },
    };

    const snippeResponse = await fetch('https://api.snippe.sh/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SNIPPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `link-${linkId}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const snippeData = await snippeResponse.json();

    if (!snippeResponse.ok) {
      console.error('Snippe error:', JSON.stringify(snippeData));
      return new Response(JSON.stringify({ error: 'Failed to create payment link', details: snippeData }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Save to database
    const { error: insertError } = await adminClient.from('payment_links').insert({
      id: linkId,
      created_by: user.id,
      amount,
      description: description || 'Payment link',
      status: 'active',
      checkout_url: snippeData.data?.checkout_url || null,
      snippe_reference: snippeData.data?.reference || null,
      order_id: order_id || null,
      recipient_phone: recipient_phone || null,
      recipient_name: recipient_name || null,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('DB insert error:', insertError);
    }

    // Record in ledger
    await adminClient.from('ledger_entries').insert({
      transaction_type: 'collection',
      amount,
      sender_name: recipient_name || 'Customer',
      sender_id: null,
      receiver_id: user.id,
      reference: snippeData.data?.reference || linkId,
      reference_id: linkId,
      status: 'pending',
      description: description || 'Payment link created',
    });

    return new Response(JSON.stringify({
      success: true,
      payment_link_id: linkId,
      reference: snippeData.data?.reference,
      checkout_url: snippeData.data?.checkout_url,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error creating payment link:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
