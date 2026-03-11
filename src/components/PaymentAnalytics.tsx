import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ArrowDownLeft, ArrowUpRight, TrendingUp, BarChart3 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const CHART_COLORS = ["#10b981", "#ef4444", "#f59e0b", "#6366f1", "#8b5cf6", "#ec4899"];

interface DailyData { date: string; collections: number; payouts: number; }

export function PaymentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [totals, setTotals] = useState({ collections: 0, payouts: 0, commissions: 0, orders: 0 });
  const [methodBreakdown, setMethodBreakdown] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch ledger entries for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      const { data: ledger } = await supabase
        .from("ledger_entries")
        .select("*")
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

      const { data: orders } = await supabase
        .from("orders")
        .select("id, total_amount, payment_method, status, created_at")
        .gte("created_at", thirtyDaysAgo);

      const { data: walletTxns } = await supabase
        .from("wallet_transactions")
        .select("type, amount, created_at")
        .gte("created_at", thirtyDaysAgo);

      // Build daily trends
      const days: Record<string, DailyData> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(0, 10);
        days[key] = { date: key, collections: 0, payouts: 0 };
      }

      (ledger || []).forEach(e => {
        const day = e.created_at.slice(0, 10);
        if (days[day]) {
          if (["collection", "commission", "top_up"].includes(e.transaction_type)) {
            days[day].collections += e.amount;
          } else if (["payout", "withdrawal"].includes(e.transaction_type)) {
            days[day].payouts += e.amount;
          }
        }
      });

      // Add wallet transactions to daily data
      (walletTxns || []).forEach(t => {
        const day = t.created_at.slice(0, 10);
        if (days[day]) {
          if (["top_up", "escrow_release", "commission"].includes(t.type)) {
            days[day].collections += t.amount;
          } else if (["withdrawal", "escrow_hold"].includes(t.type)) {
            days[day].payouts += t.amount;
          }
        }
      });

      setDailyData(Object.values(days));

      // Compute totals
      const allOrders = orders || [];
      const completedOrders = allOrders.filter(o => ["confirmed", "delivered", "shipped"].includes(o.status));
      const totalCollections = completedOrders.reduce((s, o) => s + o.total_amount, 0);
      const totalPayouts = (ledger || []).filter(e => e.transaction_type === "payout" && e.status === "completed").reduce((s, e) => s + e.amount, 0);
      const totalCommissions = (walletTxns || []).filter(t => t.type === "commission").reduce((s, t) => s + t.amount, 0);

      setTotals({
        collections: totalCollections,
        payouts: totalPayouts,
        commissions: totalCommissions,
        orders: completedOrders.length,
      });

      // Payment method breakdown
      const methods: Record<string, number> = {};
      allOrders.forEach(o => {
        const m = o.payment_method || "unknown";
        methods[m] = (methods[m] || 0) + o.total_amount;
      });
      setMethodBreakdown(Object.entries(methods).map(([name, value]) => ({ name: name === "mobile_money" ? "Mobile Money" : name === "cash_on_delivery" ? "Cash on Delivery" : name, value })));

    } catch (err) {
      console.error(err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="h-5 w-5" />Payment Analytics</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" />Collections (30d)</CardDescription>
            <CardTitle className="text-green-600">TSh {totals.collections.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><ArrowUpRight className="h-3 w-3" />Payouts (30d)</CardDescription>
            <CardTitle className="text-red-600">TSh {totals.payouts.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />Commissions</CardDescription>
            <CardTitle className="text-primary">TSh {totals.commissions.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><DollarSign className="h-3 w-3" />Completed Orders</CardDescription>
            <CardTitle>{totals.orders}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Cash Flow Chart */}
      <Card>
        <CardHeader><CardTitle className="text-lg">30-Day Cash Flow</CardTitle></CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString("en", { day: "numeric", month: "short" })} />
                <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => `TSh ${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="collections" stroke="#10b981" name="Collections" strokeWidth={2} />
                <Line type="monotone" dataKey="payouts" stroke="#ef4444" name="Payouts" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">No data yet</p>}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Payment Methods</CardTitle></CardHeader>
        <CardContent>
          {methodBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={methodBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {methodBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => `TSh ${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">No payment data yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
