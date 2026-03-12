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
import { Loader2, Link as LinkIcon, Plus, ExternalLink, Copy, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

interface PaymentLink {
  id: string;
  amount: number;
  description: string | null;
  status: string;
  checkout_url: string | null;
  snippe_reference: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  created_at: string;
}

export function PaymentMonitoring() {
  const { user } = useAuth();
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [stats, setStats] = useState({ total: 0, active: 0, paid: 0, totalAmount: 0 });

  useEffect(() => {
    fetchLinks();
    const channel = supabase
      .channel("payment-links-monitor")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_links" }, () => fetchLinks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_links")
        .select("id, amount, description, status, checkout_url, snippe_reference, recipient_name, recipient_phone, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLinks(data || []);

      const items = data || [];
      setStats({
        total: items.length,
        active: items.filter(l => l.status === "active").length,
        paid: items.filter(l => l.status === "paid").length,
        totalAmount: items.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0),
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    
    setCreating(true);
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create payment links.');
        setCreating(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-payment-link", {
        body: { amount: amt, description, recipient_name: recipientName, recipient_phone: recipientPhone },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Payment link created!");
        setCreateOpen(false);
        setAmount(""); setDescription(""); setRecipientName(""); setRecipientPhone("");
        fetchLinks();
      } else {
        toast.error(data?.error || "Failed to create link");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create payment link");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge className="bg-green-100 text-green-700"><CheckCircle className="h-3 w-3 mr-1" />Paid</Badge>;
      case "expired": return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
      case "active": return <Badge variant="outline" className="text-blue-600"><Clock className="h-3 w-3 mr-1" />Active</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Payment Collection</h2>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Payment Link</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Payment Link</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input type="number" placeholder="Amount (TZS)" value={amount} onChange={e => setAmount(e.target.value)} />
              <Input placeholder="Recipient name (optional)" value={recipientName} onChange={e => setRecipientName(e.target.value)} />
              <Input type="tel" placeholder="Recipient phone (optional)" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} />
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <div className="flex gap-2">
                {[10000, 50000, 100000, 500000].map(a => (
                  <Button key={a} variant="outline" size="sm" onClick={() => setAmount(String(a))}>{a.toLocaleString()}</Button>
                ))}
              </div>
              <Button className="w-full" onClick={handleCreateLink} disabled={creating}>
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                Generate Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardDescription>Total Links</CardDescription><CardTitle>{stats.total}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Active</CardDescription><CardTitle className="text-blue-600">{stats.active}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Paid</CardDescription><CardTitle className="text-green-600">{stats.paid}</CardTitle></CardHeader></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Total Collected</CardDescription><CardTitle>TSh {stats.totalAmount.toLocaleString()}</CardTitle></CardHeader></Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Payment Links</CardTitle></CardHeader>
        <CardContent>
          {links.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payment links yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {links.map(link => (
                    <TableRow key={link.id}>
                      <TableCell className="font-mono text-xs">{link.snippe_reference || link.id.slice(0, 8)}</TableCell>
                      <TableCell className="font-semibold">TSh {link.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <div>{link.recipient_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{link.recipient_phone || ""}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(link.status)}</TableCell>
                      <TableCell className="text-sm">{new Date(link.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {link.checkout_url && (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => copyLink(link.checkout_url!)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" asChild>
                                <a href={link.checkout_url} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4" /></a>
                              </Button>
                            </>
                          )}
                        </div>
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
