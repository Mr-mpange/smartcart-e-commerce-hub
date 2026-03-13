// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentPayload {
  payment_type: string
  details: {
    amount: number
    currency: string
  }
  phone_number: string // Required by Snippe API for link creation (but doesn't send USSD)
  customer: {
    firstname: string
    lastname: string
    email: string
  }
  description?: string
  webhook_url: string
  redirect_url?: string // Add redirect URL for payment links
  metadata: {
    payment_link_id: string
    order_id?: string | null
    created_by: string
  }
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

    const { amount, description, recipient_phone, recipient_name, order_id } = requestBody

    console.log('Extracted values:', { amount, description, recipient_phone, recipient_name, order_id })

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Remove user profile phone fetching since payment links should be generic
    const linkId = crypto.randomUUID()

    console.log('Creating generic payment link for amount:', amount)

    const webhookUrl = `${SUPABASE_URL}/functions/v1/snippe-webhook`

    // Create payload for Snippe API using the correct format
    // Snippe requires phone_number for link creation but doesn't send USSD to it
    // The actual payment can come from any phone when someone uses the link
    const paymentPayload: PaymentPayload = {
      payment_type: 'mobile',
      details: {
        amount: Math.round(amount),
        currency: 'TZS',
      },
      phone_number: recipient_phone && recipient_phone.trim() ? 
        (() => {
          let phone = recipient_phone.replace(/[^0-9]/g, '')
          if (phone.startsWith('0')) phone = '255' + phone.substring(1)
          if (phone && !phone.startsWith('255')) phone = '255' + phone
          return phone.length >= 12 ? phone : '255754000000'
        })() : '255754000000', // Valid Vodacom number format for link creation
      customer: {
        firstname: (recipient_name && recipient_name.trim()) ? recipient_name.split(' ')[0] : 'Customer',
        lastname: (recipient_name && recipient_name.trim()) ? recipient_name.split(' ').slice(1).join(' ') || 'User' : 'User',
        email: user.email || 'customer@smartcart.co.tz',
      },
      webhook_url: webhookUrl,
      redirect_url: `${SUPABASE_URL.replace('/functions/v1', '')}/payment/${linkId}`, // Add redirect URL for payment links
      metadata: { 
        payment_link_id: linkId, 
        order_id: order_id || null,
        created_by: user.id 
      },
    }

    // Add description if provided
    if (description && description.trim()) {
      paymentPayload.description = description.trim()
    }

    console.log('Payment payload before sending:', JSON.stringify(paymentPayload, null, 2))

    try {
      const snippeResponse = await fetch('https://api.snippe.sh/v1/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SNIPPE_API_KEY}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': `link-${linkId}`,
        },
        body: JSON.stringify(paymentPayload),
      })

      const snippeData = await snippeResponse.json()
      console.log('Snippe response status:', snippeResponse.status)
      console.log('Snippe response data:', snippeData)

      if (snippeResponse.ok && snippeData.data) {
        console.log('Snippe success response:', JSON.stringify(snippeData, null, 2))
        console.log('Payment link URL from Snippe:', snippeData.data.payment_link_url)
        console.log('Checkout URL from Snippe:', snippeData.data.checkout_url)
        console.log('All Snippe data keys:', Object.keys(snippeData.data))
        
        // Return the raw response for debugging
        return new Response(JSON.stringify({
          success: true,
          payment_link_id: linkId,
          reference: snippeData.data.reference,
          raw_snippe_response: snippeData,
          available_fields: Object.keys(snippeData.data),
          payment_link_url: snippeData.data.payment_link_url,
          checkout_url: snippeData.data.checkout_url,
          message: 'Check raw_snippe_response to see all available fields'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } else {
        // Snippe API returned error
        console.error('Snippe API error - Status:', snippeResponse.status)
        console.error('Snippe API error - Data:', snippeData)
        return new Response(JSON.stringify({ 
          error: 'Snippe API error', 
          details: snippeData,
          status: snippeResponse.status,
          message: snippeData.message || 'Payment service unavailable'
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