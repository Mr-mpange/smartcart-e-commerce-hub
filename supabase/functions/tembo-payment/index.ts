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
    const TEMBO_ACCOUNT_ID = Deno.env.get('TEMBO_ACCOUNT_ID')
    // @ts-ignore
    const TEMBO_SECRET = Deno.env.get('TEMBO_SECRET')
    // @ts-ignore
    const TEMBO_API_URL = Deno.env.get('TEMBO_API_URL')
    // @ts-ignore
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    // @ts-ignore
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    console.log('Tembo credentials check:', {
      hasAccountId: !!TEMBO_ACCOUNT_ID,
      hasSecret: !!TEMBO_SECRET,
      hasApiUrl: !!TEMBO_API_URL,
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

    if (!TEMBO_ACCOUNT_ID || !TEMBO_SECRET) {
      console.error('Tembo credentials not configured')
      return new Response(JSON.stringify({ 
        error: 'Tembo not configured',
        message: 'TEMBO_ACCOUNT_ID and TEMBO_SECRET are required'
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

    const { amount, phone_number, description, order_id, frontend_url } = requestBody

    console.log('Extracted values:', { amount, phone_number, description, order_id, frontend_url })

    if (!amount || amount <= 0) {
      console.error('Invalid amount:', amount)
      return new Response(JSON.stringify({ error: 'Valid amount is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (!phone_number || !phone_number.trim()) {
      console.error('Phone number is required')
      return new Response(JSON.stringify({ error: 'Phone number is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const linkId = crypto.randomUUID()
    
    // Generate slug for shareable URL
    const generateSlug = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      return Array.from({ length: 8 }, () => 
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    };
    const slug = generateSlug()

    console.log('Creating Tembo payment for amount:', amount)
    console.log('Generated slug:', slug)

    const webhookUrl = `${SUPABASE_URL}/functions/v1/tembo-webhook`
    const baseUrl = frontend_url || 'https://uzanasi.online'

    // Format phone number
    let phoneNumber = phone_number.trim().replace(/[^0-9]/g, '')
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '255' + phoneNumber.substring(1)
    }
    if (!phoneNumber.startsWith('255')) {
      phoneNumber = '255' + phoneNumber
    }

    // Create Tembo payment request
    // Tembo API might require credentials in URL or as basic auth
    const temboPayload = {
      account_id: TEMBO_ACCOUNT_ID,
      secret: TEMBO_SECRET,
      phone: phoneNumber,
      amount: Math.round(amount),
      reference: `LINK-${slug}`,
      callback_url: webhookUrl,
      description: description || 'Payment Link',
    }

    console.log('Tembo payload:', JSON.stringify(temboPayload, null, 2))

    try {
      console.log('Calling Tembo Collection API...')
      
      // Generate request ID for Tembo API
      const requestId = crypto.randomUUID()
      
      // Get collection account number first
      const balanceResponse = await fetch(`${TEMBO_API_URL}/wallet/collection-balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify({}),
      })

      let collectionAccountNo = '9000911192' // fallback
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json()
        collectionAccountNo = balanceData.accountNo || collectionAccountNo
      }

      // Determine service code based on phone number prefix
      let serviceCode = 'TZ-AIRTEL-C2B'
      if (phoneNumber.startsWith('255065') || phoneNumber.startsWith('255071')) {
        serviceCode = 'TZ-TIGO-C2B'
      } else if (phoneNumber.startsWith('255062')) {
        serviceCode = 'TZ-HALOTEL-C2B'
      }

      const collectionPayload = {
        countryCode: 'TZ',
        accountNo: collectionAccountNo,
        serviceCode: serviceCode,
        amount: Math.round(amount),
        msisdn: phoneNumber,
        narration: description || 'Payment Link',
        currencyCode: 'TZS',
        recipientNames: 'Customer',
        transactionRef: `LINK-${slug}`,
        transactionDate: new Date().toISOString(),
        callbackUrl: `${SUPABASE_URL}/functions/v1/tembo-webhook`,
      }

      console.log('Collection payload:', JSON.stringify(collectionPayload, null, 2))

      const temboResponse = await fetch(`${TEMBO_API_URL}/payment/mobile-to-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-account-id': TEMBO_ACCOUNT_ID,
          'x-secret-key': TEMBO_SECRET,
          'x-request-id': requestId,
        },
        body: JSON.stringify(collectionPayload),
      })

      console.log('Tembo response status:', temboResponse.status)
      
      let temboData
      try {
        temboData = await temboResponse.json()
      } catch (e) {
        console.error('Failed to parse Tembo response as JSON:', e)
        const text = await temboResponse.text()
        console.error('Tembo response text:', text)
        throw new Error(`Tembo API returned invalid JSON: ${text}`)
      }
      
      console.log('Tembo response data:', JSON.stringify(temboData, null, 2))

      if (temboResponse.ok && temboData.status === 'success') {
        console.log('Tembo success response:', JSON.stringify(temboData, null, 2))
        
        const reference = temboData.reference || `LINK-${slug}`
        const paymentLink = `${baseUrl}/pay/${slug}`

        console.log('Payment link created:', paymentLink)
        console.log('Tembo reference:', reference)

        // Save payment link to database
        const { error: dbError } = await adminClient
          .from('payment_links')
          .insert({
            id: linkId,
            slug: slug,
            amount: Math.round(amount),
            description: description && description.trim() ? description.trim() : null,
            status: 'active',
            checkout_url: `${TEMBO_API_URL}/pay/${reference}`,
            snippe_reference: reference,
            recipient_phone: phoneNumber,
            created_by: user.id,
            created_at: new Date().toISOString(),
            views: 0,
            payments_count: 0,
            total_collected: 0
          })

        if (dbError) {
          console.error('Failed to save payment link to database:', dbError)
          console.warn('Payment link created in Tembo but not saved to DB:', dbError)
        }

        return new Response(JSON.stringify({
          success: true,
          payment_link_id: linkId,
          slug: slug,
          reference: reference,
          payment_link_url: `${baseUrl}/pay/${slug}`,
          shareable_link: `${baseUrl}/pay/${slug}`,
          checkout_url: `${TEMBO_API_URL}/pay/${reference}`,
          tembo_reference: reference,
          message: 'Payment link created successfully. USSD push will be sent to ' + phoneNumber
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

      } else {
        // Tembo API returned error
        console.error('Tembo API error - Status:', temboResponse.status)
        console.error('Tembo API error - Data:', JSON.stringify(temboData, null, 2))
        
        return new Response(JSON.stringify({ 
          error: 'Tembo API error', 
          details: temboData,
          status: temboResponse.status,
          message: temboData.message || temboData.error || 'Payment service unavailable'
        }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        })
      }

    } catch (fetchError: any) {
      return new Response(JSON.stringify({ 
        error: 'Failed to connect to Tembo', 
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
