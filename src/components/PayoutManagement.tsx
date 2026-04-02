import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2, Send, Users, CheckCircle, XCircle, Clock,
  ArrowUpRight, AlertTriangle, ThumbsUp, ThumbsDown,
} from "lucide-react";

interface Payout {
  id: string;
  recipient_phone: string;
  recipient_name: string | null;
  amount: number;
  payout_type: string;
  status: string;
  tembo_reference: string | null;
  approval_required: boolean;
  description: string | null;
  created_at: string;
}

export function PayoutManagement() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, totalSent: 0 });

  useEffect(() => {
    fetchPayouts();
    const channel = supabase
      .channel("payouts-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "payouts" }, () => fetchPayouts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("id, recipient_phone, recipient_name, amount, payout_type, status, tembo_reference, approval_required, description, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setPayouts(data || []);
      const items = data || [];
      setStats({
        total: items.length,
        pending: items.filter(p => p.status === "pending_approval").length,
        completed: items.filter(p => p.status === "completed").length,
        totalSent: items.filter(p => p.status === "completed").reduce((s, p) => s + p.amount, 0),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  const handleSendPayout = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!phone || phone.length < 9) { toast.error("Enter a valid phone number"); return; }
    
    // Prevent double submission
    if (sending) {
      toast.error("Payout is already being processed. Please wait...");
      return;
    }
    
    setSending(true);
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to send payouts.');
        setSending(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("tembo-payout", {
        body: { action: "send", recipient_phone: phone, recipient_name: name, amount: amt, description },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.status === "pending_approval" ? "Payout submitted for approval" : "Payout sent successfully!");
        setSendOpen(false);
        setPhone(""); setName(""); setAmount(""); setDescription("");
        fetchPayouts();
      } else {
        toast.error(data?.error || "Payout failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Payout failed");
    } finally {
      setSending(false);
    }
  };

  const handleApprove = async (payoutId: string) => {
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to approve payouts.');
        return;
      }

      const { data, error } = await supabase.functions.invoke("tembo-payout", {
        body: { action: "approve", payout_id: payoutId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      toast.success("Payout approved and processing");
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Approval failed");
    }
  };

  const handleReject = async (payoutId: string) => {
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to reject payouts.');
        return;
      }

      const { data, error } = await supabase.functions.invoke("tembo-payout", {
        body: { action: "reject", payout_id: payoutId, reason: "Rejected by admin" },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      toast.success("Payout rejected");
      fetchPayouts();
    } catch (err: any) {
      toast.error(err.message || "Rejection failed");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case "failed": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case "processing": return <Badge variant="outline" className="text-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Processing</Badge>;
      case "pending_approval": return <Badge variant="outline" className="text-amber-600"><AlertTriangle className="h-3 w-3 mr-1" />Needs Approval</Badge>;
      case "rejected": return <Badge variant="destructive"><ThumbsDown className="h-3 w-3 mr-1" />Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const pendingPayouts = payouts.filter(p => p.status === "pending_approval");
  const allPayouts = payouts;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Payout Engine</h2>
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogTrigger asChild>
            <Button><Send className="mr-2 h-4 w-4" />Send Payout</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Send Payout</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input type="tel" placeholder="Recipient phone (+255...)" value={phone} onChange={e => setPhone(e.target.value)} />
              <Input placeholder="Recipient name" value={name} onChange={e => setName(e.target.value)} />
              <Input type="number" placeholder="Amount (TZS)" value={amount} onChange={e => setAmount(e.target.value)} />
              <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].map(a => (
                  <Button key={a} variant="outline" size="sm" onClick={() => setAmount(String(a))}>{a.toLocaleString()}</Button>
                ))}
              </div>
              {parseFloat(amount) >= 500000 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Amounts ≥ TZS 500,000 require admin approval
                </p>
              )}
              <Button className="w-full" onClick={handleSendPayout} disabled={sending}>
                {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUpRight className="mr-2 h-4 w-4" />}
                Send TSh {parseFloat(amount || "0").toLocaleString()}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Payouts</CardDescription><CardTitle>{stats.total}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Pending Approval</CardDescription><CardTitle className="text-amber-600">{stats.pending}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Completed</CardDescription><CardTitle className="text-green-600">{stats.completed}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Sent</CardDescription><CardTitle>TSh {stats.totalSent.toLocaleString()}</CardTitle></CardHeader></Card>
      </div>

      <Tabs defaultValue={pendingPayouts.length > 0 ? "pending" : "all"}>
        <TabsList>
          <TabsTrigger value="pending">Pending Approval ({pendingPayouts.length})</TabsTrigger>
          <TabsTrigger value="all">All Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardContent className="pt-6">
              {pendingPayouts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payouts pending approval</p>
              ) : (
                <div className="space-y-3">
                  {pendingPayouts.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">TSh {p.amount.toLocaleString()}</p>
                        <p className="text-sm">{p.recipient_name || p.recipient_phone}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleApprove(p.id)}>
                          <ThumbsUp className="h-4 w-4 mr-1" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleReject(p.id)}>
                          <ThumbsDown className="h-4 w-4 mr-1" />Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPayouts.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>{p.recipient_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{p.recipient_phone}</div>
                        </TableCell>
                        <TableCell className="font-semibold">TSh {p.amount.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline">{p.payout_type}</Badge></TableCell>
                        <TableCell>{getStatusBadge(p.status)}</TableCell>
                        <TableCell className="text-sm">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
