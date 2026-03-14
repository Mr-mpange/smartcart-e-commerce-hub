import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface WalletBalance {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'payout';
  amount: number;
  source: 'stripe' | 'tembo' | 'manual';
  referenceId: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

/**
 * Get or create wallet for user
 */
export async function getOrCreateWallet(userId: string): Promise<WalletBalance | null> {
  try {
    // Try to get existing wallet
    const { data: wallet, error: getError } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (wallet) {
      return {
        id: wallet.id,
        userId: wallet.user_id,
        balance: wallet.balance,
        currency: wallet.currency,
        createdAt: wallet.created_at,
        updatedAt: wallet.updated_at,
      };
    }

    // Create new wallet if doesn't exist
    const { data: newWallet, error: createError } = await supabase
      .from('wallets')
      .insert({
        user_id: userId,
        balance: 0,
        currency: 'TZS',
      })
      .select()
      .single();

    if (createError) throw createError;

    return {
      id: newWallet.id,
      userId: newWallet.user_id,
      balance: newWallet.balance,
      currency: newWallet.currency,
      createdAt: newWallet.created_at,
      updatedAt: newWallet.updated_at,
    };
  } catch (error) {
    console.error('Error getting/creating wallet:', error);
    return null;
  }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    return null;
  }
}

/**
 * Add funds to wallet (from Stripe payment)
 */
export async function addFundsFromStripe(
  userId: string,
  amount: number,
  stripePaymentId: string,
  description: string = 'Stripe payment'
): Promise<boolean> {
  try {
    // Get or create wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) throw new Error('Failed to get wallet');

    // Add funds
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance + amount })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'deposit',
        amount: amount,
        source: 'stripe',
        reference_id: stripePaymentId,
        status: 'completed',
        description: description,
      });

    if (txError) throw txError;

    return true;
  } catch (error) {
    console.error('Error adding funds from Stripe:', error);
    return false;
  }
}

/**
 * Deduct funds from wallet (for payout)
 */
export async function deductFundsForPayout(
  userId: string,
  amount: number,
  payoutId: string,
  description: string = 'Payout'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) return { success: false, error: 'Wallet not found' };

    // Check balance
    if (wallet.balance < amount) {
      return { success: false, error: `Insufficient balance. Available: ${wallet.balance} TZS, Required: ${amount} TZS` };
    }

    // Deduct funds
    const { error: updateError } = await supabase
      .from('wallets')
      .update({ balance: wallet.balance - amount })
      .eq('id', wallet.id);

    if (updateError) throw updateError;

    // Record transaction
    const { error: txError } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        type: 'withdrawal',
        amount: amount,
        source: 'tembo',
        reference_id: payoutId,
        status: 'pending',
        description: description,
      });

    if (txError) throw txError;

    return { success: true };
  } catch (error) {
    console.error('Error deducting funds:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get wallet transaction history
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<WalletTransaction[] | null> {
  try {
    // Get wallet
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) return null;

    // Get transactions
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map((tx) => ({
      id: tx.id,
      walletId: tx.wallet_id,
      type: tx.type,
      amount: tx.amount,
      source: tx.source,
      referenceId: tx.reference_id,
      status: tx.status,
      description: tx.description,
      createdAt: tx.created_at,
    })) || [];
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return null;
  }
}

/**
 * Update transaction status
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('wallet_transactions')
      .update({ status })
      .eq('id', transactionId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating transaction status:', error);
    return false;
  }
}

/**
 * Get wallet summary
 */
export async function getWalletSummary(userId: string) {
  try {
    const wallet = await getOrCreateWallet(userId);
    if (!wallet) return null;

    const transactions = await getTransactionHistory(userId, 10);

    // Calculate totals
    const deposits = transactions?.filter((tx) => tx.type === 'deposit').reduce((sum, tx) => sum + tx.amount, 0) || 0;
    const withdrawals = transactions?.filter((tx) => tx.type === 'withdrawal').reduce((sum, tx) => sum + tx.amount, 0) || 0;
    const payouts = transactions?.filter((tx) => tx.type === 'payout').reduce((sum, tx) => sum + tx.amount, 0) || 0;

    return {
      balance: wallet.balance,
      currency: wallet.currency,
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      totalPayouts: payouts,
      recentTransactions: transactions || [],
    };
  } catch (error) {
    console.error('Error getting wallet summary:', error);
    return null;
  }
}
