import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Download, ArrowDownLeft, ArrowUpRight, RefreshCw, Search } from "lucide-react";

interface LedgerEntry {
  id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  sender_name: string | null;
  receiver_name: string | null;
  reference: string | null;
  status: string;
  description: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  collection: "Collection",
  payout: "Payout",
  commission: "Commission",
  refund: "Refund",
  escrow_hold: "Escrow Hold",
  escrow_release: "Escrow Release",
  top_up: "Top Up",
  withdrawal: "Withdrawal",
};

export function FinancialLedger() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalIn: 0, totalOut: 0, net: 0 });

  useEffect(() => {
    fetchEntries();
    const channel = supabase
      .channel("ledger-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "ledger_entries" }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("ledger_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) throw error;
      setEntries(data || []);

      const items = data || [];
      const totalIn = items.filter(e => ["collection", "commission", "top_up", "escrow_release"].includes(e.transaction_type) && e.status === "completed").reduce((s, e) => s + e.amount, 0);
      const totalOut = items.filter(e => ["payout", "withdrawal", "refund"].includes(e.transaction_type) && e.status === "completed").reduce((s, e) => s + e.amount, 0);
      setStats({ totalIn, totalOut, net: totalIn - totalOut });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter(e => {
    if (filter !== "all" && e.transaction_type !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (e.reference?.toLowerCase().includes(s) || e.description?.toLowerCase().includes(s) || e.sender_name?.toLowerCase().includes(s) || e.receiver_name?.toLowerCase().includes(s));
    }
    return true;
  });

  const exportCSV = () => {
    const headers = "Date,Type,Amount,Currency,Sender,Receiver,Reference,Status,Description\n";
    const rows = filteredEntries.map(e =>
      `${new Date(e.created_at).toISOString()},${e.transaction_type},${e.amount},${e.currency},${e.sender_name || ""},${e.receiver_name || ""},${e.reference || ""},${e.status},${(e.description || "").replace(/,/g, ";")}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ledger-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success("Ledger exported");
  };

  const isCredit = (type: string) => ["collection", "commission", "top_up", "escrow_release"].includes(type);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold flex items-center gap-2"><BookOpen className="h-5 w-5" />Financial Ledger</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchEntries}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />Export CSV</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Inflow</CardTitle><CardTitle className="text-green-600">TSh {stats.totalIn.toLocaleString()}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Outflow</CardTitle><CardTitle className="text-red-600">TSh {stats.totalOut.toLocaleString()}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Net Balance</CardTitle><CardTitle className={stats.net >= 0 ? "text-green-600" : "text-red-600"}>TSh {stats.net.toLocaleString()}</CardTitle></CardHeader></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search ledger..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {filteredEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No ledger entries found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>From/To</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm">{new Date(entry.created_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isCredit(entry.transaction_type)
                            ? <ArrowDownLeft className="h-3 w-3 text-green-600" />
                            : <ArrowUpRight className="h-3 w-3 text-red-600" />}
                          <span className="text-sm">{typeLabels[entry.transaction_type] || entry.transaction_type}</span>
                        </div>
                      </TableCell>
                      <TableCell className={`font-semibold ${isCredit(entry.transaction_type) ? "text-green-600" : "text-red-600"}`}>
                        {isCredit(entry.transaction_type) ? "+" : "-"}TSh {entry.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{entry.sender_name || "—"}</div>
                        {entry.receiver_name && <div className="text-xs text-muted-foreground">→ {entry.receiver_name}</div>}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{entry.reference?.slice(0, 12) || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === "completed" ? "default" : entry.status === "failed" ? "destructive" : "outline"}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
