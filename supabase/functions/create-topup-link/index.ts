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
    const SNIPPE_API_KEY = Deno.env.get('SNIPPE_API_KEY')
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!SNIPPE_API_KEY) {
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured',
        message: 'SNIPPE_API_KEY is required'
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    // @ts-ignore
    const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const { amount, frontend_url } = await req.json()

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const topupId = crypto.randomUUID()
    const baseUrl = frontend_url || 'https://uzanasi.online'
    const webhookUrl = `${SUPABASE_URL}/functions/v1/snippe-topup-webhook`

    // Create payment payload for Snippe
    const paymentPayload: any = {
      payment_type: 'mobile',
      details: {
        amount: Math.round(amount),
        currency: 'TZS',
      },
      phone_number: '255754000000', // Placeholder phone (without +)
      customer: {
        firstname: 'Wallet',
        lastname: 'TopUp',
        email: user.email || 'topup@smartcart.co.tz',
      },
      webhook_url: webhookUrl,
      redirect_url: `${baseUrl}/wallet`,
      metadata: { 
        topup_id: topupId,
        user_id: user.id,
        type: 'wallet_topup'
      },
      description: `Wallet Top-Up - TSh ${Math.round(amount).toLocaleString()}`,
    }

    console.log('Creating top-up payment with Snippe:', JSON.stringify(paymentPayload, null, 2))

    // Call Snippe API
    const snippeResponse = await fetch('https://api.snippe.sh/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SNIPPE_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `topup-${topupId}`,
      },
      body: JSON.stringify(paymentPayload),
    })

    const snippeData = await snippeResponse.json()
    
    console.log('Snippe response:', JSON.stringify(snippeData, null, 2))

    if (snippeResponse.ok && snippeData.data) {
      const reference = snippeData.data.reference
      const topupLink = `${baseUrl}/wallet?topup=${topupId}`

      // Create top-up record in database
      const { error: dbError } = await adminClient
        .from('top_ups')
        .insert({
          id: topupId,
          user_id: user.id,
          amount: Math.round(amount),
          status: 'pending',
          snippe_reference: reference,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to save top-up record:', dbError)
      }

      return new Response(JSON.stringify({
        success: true,
        topup_id: topupId,
        reference: reference,
        payment_link: topupLink,
        checkout_url: snippeData.data.checkout_url || topupLink,
        message: 'Top-up payment link created successfully'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } else {
      console.error('Snippe API error:', JSON.stringify(snippeData, null, 2))
      
      return new Response(JSON.stringify({ 
        error: 'Payment service error', 
        details: snippeData,
        message: snippeData.message || 'Failed to create payment link'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

  } catch (error: any) {
    console.error('Top-up error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to create top-up link', 
      details: error.message || 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
