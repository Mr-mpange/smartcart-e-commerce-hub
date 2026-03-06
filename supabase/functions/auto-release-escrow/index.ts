import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const AUTO_RELEASE_DAYS = 14;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - AUTO_RELEASE_DAYS);

    // Find escrows held for more than 14 days without disputes
    const { data: escrows, error: fetchError } = await supabase
      .from('escrows')
      .select('id, order_id, buyer_id, vendor_id, amount, commission_amount')
      .eq('status', 'held')
      .lt('created_at', cutoffDate.toISOString());

    if (fetchError) throw fetchError;

    if (!escrows || escrows.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No escrows to auto-release', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which orders have active disputes
    const orderIds = [...new Set(escrows.map(e => e.order_id))];
    const { data: disputedOrders } = await supabase
      .from('orders')
      .select('id, dispute_status')
      .in('id', orderIds)
      .in('dispute_status', ['pending', 'under_review']);

    const disputedOrderIds = new Set(disputedOrders?.map(o => o.id) || []);

    // Filter out escrows with active disputes
    const releasable = escrows.filter(e => !disputedOrderIds.has(e.order_id));

    let released = 0;
    let failed = 0;

    // Find admin user for commission
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    for (const escrow of releasable) {
      try {
        const vendorAmount = escrow.amount - escrow.commission_amount;

        // Get or create vendor wallet
        let { data: vendorWallet } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', escrow.vendor_id)
          .single();

        if (!vendorWallet) {
          const { data: newWallet } = await supabase
            .from('wallets')
            .insert({ user_id: escrow.vendor_id })
            .select('id')
            .single();
          vendorWallet = newWallet;
        }

        if (vendorWallet) {
          // Credit vendor
          await supabase.from('wallets')
            .update({ balance: supabase.rpc ? undefined : 0 })
            .eq('id', vendorWallet.id);
          
          // Use raw update with increment
          const { data: currentWallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('id', vendorWallet.id)
            .single();
          
          await supabase.from('wallets')
            .update({ balance: (currentWallet?.balance || 0) + vendorAmount, updated_at: new Date().toISOString() })
            .eq('id', vendorWallet.id);

          await supabase.from('wallet_transactions').insert({
            wallet_id: vendorWallet.id,
            type: 'escrow_release',
            amount: vendorAmount,
            description: 'Auto-released after 14 days',
            reference_id: escrow.order_id,
          });
        }

        // Credit admin commission
        if (adminRole && escrow.commission_amount > 0) {
          let { data: adminWallet } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', adminRole.user_id)
            .single();

          if (!adminWallet) {
            const { data: newWallet } = await supabase
              .from('wallets')
              .insert({ user_id: adminRole.user_id })
              .select('id, balance')
              .single();
            adminWallet = newWallet;
          }

          if (adminWallet) {
            await supabase.from('wallets')
              .update({ balance: (adminWallet.balance || 0) + escrow.commission_amount, updated_at: new Date().toISOString() })
              .eq('id', adminWallet.id);

            await supabase.from('wallet_transactions').insert({
              wallet_id: adminWallet.id,
              type: 'commission',
              amount: escrow.commission_amount,
              description: 'Commission from auto-released order',
              reference_id: escrow.order_id,
            });
          }
        }

        // Mark escrow as released
        await supabase.from('escrows')
          .update({ status: 'released', released_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', escrow.id);

        // Update order status
        await supabase.from('orders')
          .update({ status: 'delivered' })
          .eq('id', escrow.order_id);

        released++;
      } catch (err) {
        console.error(`Failed to auto-release escrow ${escrow.id}:`, err);
        failed++;
      }
    }

    console.log(`Auto-release complete: ${released} released, ${failed} failed, ${escrows.length - releasable.length} skipped (disputed)`);

    return new Response(
      JSON.stringify({ released, failed, skipped: escrows.length - releasable.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Auto-release escrow error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
