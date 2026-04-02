// @ts-ignore
import { createClient } from 'npm:@supabase/supabase-js@2'

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

    console.log('Environment variables check:', {
      hasSnippeKey: !!SNIPPE_API_KEY,
      snippeKeyLength: SNIPPE_API_KEY ? SNIPPE_API_KEY.length : 0,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY
    })

    // Parse request body
    let requestBody
    try {
      requestBody = await req.json()
      console.log('Parsed request body:', requestBody)
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: parseError.message
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (!SNIPPE_API_KEY) {
      console.error('SNIPPE_API_KEY not configured')
      return new Response(JSON.stringify({ 
        error: 'Payment service not configured',
        message: 'SNIPPE_API_KEY is required. Please configure it in your Supabase project settings.'
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

    const { amount, description, recipient_phone, recipient_name, order_id, frontend_url } = requestBody

    console.log('Extracted values:', { amount, description, recipient_phone, recipient_name, order_id, frontend_url })

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const linkId = crypto.randomUUID()
    
    const webhookUrl = `${SUPABASE_URL}/functions/v1/snippe-webhook`
    const baseUrl = frontend_url || 'https://uzanasi.online'

    // Format recipient phone
    let customerPhone: string | undefined
    if (recipient_phone && recipient_phone.trim()) {
      let phone = recipient_phone.trim().replace(/[^0-9]/g, '')
      if (phone.startsWith('0')) phone = '255' + phone.substring(1)
      if (phone.startsWith('255')) customerPhone = '+' + phone
    }

    // Build Snippe Sessions API payload
    const paymentPayload: any = {
      amount: Math.round(amount),
      currency: 'TZS',
      allowed_methods: ['mobile_money', 'card'],
      customer: {
        name: recipient_name || 'Customer',
        phone: customerPhone || undefined,
        email: user.email || undefined,
      },
      webhook_url: webhookUrl,
      redirect_url: `${baseUrl}/payment-success`,
      metadata: {
        payment_link_id: linkId,
        order_id: order_id || null,
        created_by: user.id,
      },
      expires_in: 86400, // 24 hours
    }

    if (description && description.trim()) {
      paymentPayload.description = description.trim()
    }

    console.log('Snippe session payload:', JSON.stringify(paymentPayload, null, 2))

    try {
      const snippeResponse = await fetch('https://api.snippe.sh/api/v1/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SNIPPE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentPayload),
      })

      console.log('Snippe response status:', snippeResponse.status)

      let snippeData: any
      try {
        snippeData = await snippeResponse.json()
      } catch (e) {
        const text = await snippeResponse.text()
        throw new Error(`Snippe API returned invalid JSON: ${text}`)
      }

      console.log('Snippe response data:', JSON.stringify(snippeData, null, 2))

      if ((snippeResponse.ok || snippeResponse.status === 201) && snippeData.data) {
        const reference = snippeData.data.reference
        const snippeCheckoutUrl = snippeData.data.checkout_url
        const paymentLinkUrl = snippeData.data.payment_link_url  // https://snippe.me/p/Ax7kM2
        const slug = snippeData.data.short_code                  // use Snippe's short_code as slug

        console.log('Reference:', reference, '| Checkout:', snippeCheckoutUrl, '| Link:', paymentLinkUrl)

        // Save payment link to database
        const { error: dbError } = await adminClient
          .from('payment_links')
          .insert({
            id: linkId,
            slug: slug,
            amount: Math.round(amount),
            description: description && description.trim() ? description.trim() : null,
            status: 'active',
            checkout_url: snippeCheckoutUrl,
            snippe_reference: reference,
            recipient_name: (recipient_name && recipient_name.trim()) ? recipient_name.trim() : null,
            recipient_phone: (recipient_phone && recipient_phone.trim()) ? recipient_phone.trim() : null,
            created_by: user.id,
            created_at: new Date().toISOString(),
            views: 0,
            payments_count: 0,
            total_collected: 0
          })

        if (dbError) {
          console.error('Failed to save payment link to database:', dbError)
          console.warn('Payment link created in Snippe but not saved to DB:', dbError)
        }

        return new Response(JSON.stringify({
          success: true,
          payment_link_id: linkId,
          slug: slug,
          reference: reference,
          payment_link: paymentLinkUrl,
          payment_link_url: paymentLinkUrl,
          shareable_link: paymentLinkUrl,
          checkout_url: snippeCheckoutUrl,
          snippe_reference: reference,
          message: 'Payment link created successfully. Share this link to receive payments.'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } else {
        // Snippe API returned error
        console.error('Snippe API error - Status:', snippeResponse.status)
        console.error('Snippe API error - Data:', JSON.stringify(snippeData, null, 2))
        
        return new Response(JSON.stringify({ 
          error: 'Snippe API error', 
          details: snippeData,
          status: snippeResponse.status,
          message: snippeData.message || snippeData.error || 'Payment service unavailable'
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

    } catch (fetchError: any) {
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to payment service', 
        details: fetchError.message 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: 'Failed to create payment link', 
      details: error.message || 'Unknown error' 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})