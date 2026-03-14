import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Wallet as WalletIcon,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Clock,
  Loader2,
  TrendingUp,
  Lock,
} from "lucide-react";

interface WalletData {
  id: string;
  balance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface Escrow {
  id: string;
  order_id: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  top_up: "Top Up",
  escrow_hold: "Escrow Hold",
  escrow_release: "Payment Received",
  commission: "Commission Earned",
  withdrawal: "Withdrawal",
  refund: "Refund",
};

const typeIcons: Record<string, typeof ArrowDownLeft> = {
  top_up: ArrowDownLeft,
  escrow_hold: Lock,
  escrow_release: ArrowDownLeft,
  commission: TrendingUp,
  withdrawal: ArrowUpRight,
  refund: ArrowDownLeft,
};

const Wallet = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchWalletData();

    const channel = supabase
      .channel("wallet-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` }, () => fetchWalletData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;
    try {
      // Get or create wallet
      let { data: walletData, error } = await supabase
        .from("wallets")
        .select("id, balance, currency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!walletData) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallets")
          .insert({ user_id: user.id })
          .select("id, balance, currency")
          .single();
        if (createError) throw createError;
        walletData = newWallet;
      }
      if (error) throw error;
      setWallet(walletData);

      // Fetch transactions
      if (walletData) {
        const { data: txns } = await supabase
          .from("wallet_transactions")
          .select("id, type, amount, description, created_at")
          .eq("wallet_id", walletData.id)
          .order("created_at", { ascending: false })
          .limit(50);
        setTransactions(txns || []);
      }

      // Fetch escrows
      const escrowFilter = userRole === "vendor"
        ? supabase.from("escrows").select("*").eq("vendor_id", user.id)
        : supabase.from("escrows").select("*").eq("buyer_id", user.id);
      
      const { data: escrowData } = await escrowFilter.order("created_at", { ascending: false }).limit(20);
      setEscrows(escrowData || []);
    } catch (err: any) {
      console.error("Wallet error:", err);
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !wallet) {
      toast.error("Enter a valid amount");
      return;
    }
    setTopUpLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to top up wallet');
        return;
      }

      // Call create-topup-link edge function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-topup-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          frontend_url: window.location.origin
        }),
      });

      const data = await response.json();
      console.log('Top-up response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create top-up link');
      }

      if (data.success) {
        toast.success('Redirecting to payment...');
        // Redirect to payment link
        window.location.href = data.checkout_url || data.payment_link;
      } else {
        throw new Error(data.message || 'Failed to create top-up link');
      }
    } catch (err: any) {
      console.error('Top-up error:', err);
      toast.error(err.message || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0 || !wallet) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amount > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!withdrawPhone || withdrawPhone.length < 9) {
      toast.error("Enter a valid phone number");
      return;
    }
    setWithdrawLoading(true);
    try {
      const { error: updateError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance - amount })
        .eq("id", wallet.id);
      if (updateError) throw updateError;

      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        type: "withdrawal",
        amount,
        description: `Withdrawal to ${withdrawPhone}`,
      });

      toast.success(`TSh ${amount.toLocaleString()} withdrawal initiated to ${withdrawPhone}`);
      setWithdrawAmount("");
      setWithdrawPhone("");
      setWithdrawOpen(false);
      fetchWalletData();
    } catch (err: any) {
      toast.error("Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const heldInEscrow = escrows
    .filter((e) => e.status === "held")
    .reduce((sum, e) => sum + (userRole === "vendor" ? e.amount - e.commission_amount : e.amount), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <WalletIcon className="h-8 w-8" />
            My Wallet
          </h1>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardDescription>Available Balance</CardDescription>
                <CardTitle className="text-4xl text-primary">
                  TSh {(wallet?.balance || 0).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Top Up
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Top Up Wallet</DialogTitle>
                      <DialogDescription>Enter the amount to add to your wallet</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input
                        type="number"
                        placeholder="Amount in TSh"
                        value={topUpAmount}
                        onChange={(e) => setTopUpAmount(e.target.value)}
                      />
                      <div className="flex gap-2">
                        {[5000, 10000, 50000, 100000].map((amt) => (
                          <Button key={amt} variant="outline" size="sm" onClick={() => setTopUpAmount(String(amt))}>
                            {amt.toLocaleString()}
                          </Button>
                        ))}
                      </div>
                      <Button className="w-full" onClick={handleTopUp} disabled={topUpLoading}>
                        {topUpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                        Add TSh {parseFloat(topUpAmount || "0").toLocaleString()}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {(userRole === "vendor" || userRole === "admin") && (
                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Withdraw to Mobile Money</DialogTitle>
                        <DialogDescription>Enter amount and your mobile money number</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <Input
                          type="number"
                          placeholder="Amount in TSh"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <div className="flex gap-2">
                          {[10000, 50000, 100000].map((amt) => (
                            <Button key={amt} variant="outline" size="sm" onClick={() => setWithdrawAmount(String(amt))}>
                              {amt.toLocaleString()}
                            </Button>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setWithdrawAmount(String(wallet?.balance || 0))}>
                            All
                          </Button>
                        </div>
                        <Input
                          type="tel"
                          placeholder="+255 XXX XXX XXX"
                          value={withdrawPhone}
                          onChange={(e) => setWithdrawPhone(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                          Supports mobile money providers in Tanzania
                        </p>
                        <Button className="w-full" onClick={handleWithdraw} disabled={withdrawLoading}>
                          {withdrawLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
                          Withdraw TSh {parseFloat(withdrawAmount || "0").toLocaleString()}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Held in Escrow
                </CardDescription>
                <CardTitle className="text-2xl text-amber-600">
                  TSh {heldInEscrow.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {userRole === "vendor"
                    ? "Released when buyers confirm delivery"
                    : "Released to sellers when you confirm delivery"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Active Escrows */}
          {escrows.filter((e) => e.status === "held").length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Active Escrows
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {escrows
                  .filter((e) => e.status === "held")
                  .map((escrow) => (
                    <div key={escrow.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">Order #{escrow.order_id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(escrow.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">TSh {escrow.amount.toLocaleString()}</p>
                        <Badge variant="outline" className="text-amber-600">
                          <Clock className="mr-1 h-3 w-3" />
                          Held
                        </Badge>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((txn) => {
                    const Icon = typeIcons[txn.type] || ArrowDownLeft;
                    const isCredit = ["top_up", "escrow_release", "commission", "refund"].includes(txn.type);
                    return (
                      <div key={txn.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                        <div className={`p-2 rounded-full ${isCredit ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{typeLabels[txn.type] || txn.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {txn.description} · {new Date(txn.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <p className={`font-semibold ${isCredit ? "text-green-600" : "text-red-600"}`}>
                          {isCredit ? "+" : "-"}TSh {Math.abs(txn.amount).toLocaleString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Wallet;
