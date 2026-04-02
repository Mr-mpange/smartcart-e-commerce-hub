import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Link as LinkIcon, Plus, ExternalLink, Copy, CheckCircle, XCircle, Clock, DollarSign, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface PaymentLink {
  id: string;
  slug: string;
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
      // Get current user to filter links
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("payment_links")
        .select("id, slug, amount, description, status, checkout_url, snippe_reference, recipient_name, recipient_phone, created_at, created_by")
        .order("created_at", { ascending: false })
        .limit(100);

      // Filter by current user if not admin
      if (user) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payment links:', error);
        throw error;
      }

      console.log('Fetched payment links:', data);
      console.log('Sample link checkout_url:', data?.[0]?.checkout_url);
      console.log('Sample link slug:', data?.[0]?.slug);
      console.log('Sample link has slug?:', !!data?.[0]?.slug);
      setLinks(data || []);

      const items = data || [];
      setStats({
        total: items.length,
        active: items.filter(l => l.status === "active").length,
        paid: items.filter(l => l.status === "paid").length,
        totalAmount: items.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0),
      });
    } catch (err) {
      console.error('Failed to load payment links:', err);
      toast.error("Failed to load payment links");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLink = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { 
      toast.error("Please enter a valid amount greater than 0"); 
      return; 
    }
    
    
    setCreating(true);
    try {
      // Ensure user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to create payment links.');
        return;
      }

      console.log('Creating payment link with data:', {
        amount: amt,
        description: description || undefined,
        recipient_name: recipientName || undefined,
        recipient_phone: recipientPhone || undefined
      });

      const requestBody: any = {
        amount: amt,
        frontend_url: window.location.origin
      };

      // Only add optional fields if they have values
      if (description && description.trim()) {
        requestBody.description = description.trim();
      }
      if (recipientName && recipientName.trim()) {
        requestBody.recipient_name = recipientName.trim();
      }
      if (recipientPhone && recipientPhone.trim()) {
        requestBody.recipient_phone = recipientPhone.trim();
      }

      console.log('Final request body:', requestBody);

      // Try direct fetch to get better error details
      try {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-payment-link`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        const responseData = await response.json();
        console.log('Direct fetch response:', { status: response.status, data: responseData });

        if (!response.ok) {
          throw new Error(responseData.message || responseData.error || `HTTP ${response.status}`);
        }

        if (responseData?.success) {
          const shareableUrl = responseData.payment_link_url;
          const snippeUrl = responseData.checkout_url;
          
          console.log('Payment link created:', responseData);
          console.log('Shareable URL:', shareableUrl);
          console.log('Snippe URL:', snippeUrl);
          
          // Show success with shareable link
          toast.success(`Payment link created! Shareable: ${shareableUrl}`, { duration: 10000 });
          
          // Copy shareable link to clipboard
          if (shareableUrl) {
            navigator.clipboard.writeText(shareableUrl);
            toast.info("Shareable link copied to clipboard!", { duration: 5000 });
          }
          
          // Clear form
          setAmount(""); 
          setDescription(""); 
          setRecipientName(""); 
          setRecipientPhone("");
          setCreateOpen(false);
          
          // Refresh the links list immediately and after a delay
          fetchLinks();
          setTimeout(() => {
            fetchLinks();
          }, 2000);
        } else {
          throw new Error(responseData.message || responseData.error || 'Unknown error');
        }

      } catch (directFetchError: any) {
        console.error('Direct fetch failed, trying Supabase client:', directFetchError);
        
        // Fallback to Supabase client
        const { data, error } = await supabase.functions.invoke("create-payment-link", {
          body: requestBody,
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        console.log('Payment link response:', { data, error });

        if (error) {
          console.error('Supabase function error:', error);
          
          // The error might contain the actual response from the Edge Function
          let errorMessage = 'Failed to create payment link';
          
          if (error.message && error.message.includes('Edge Function returned a non-2xx status code')) {
            // Try to get more details from the data response
            if (data && typeof data === 'object') {
              console.log('Error response data:', data);
              if (data.error) {
                errorMessage = data.error;
              }
              if (data.message) {
                errorMessage = data.message;
              }
              if (data.details && data.details.message) {
                errorMessage = data.details.message;
              }
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          throw new Error(errorMessage);
        }

        // Check if we have data but it contains an error
        if (data && data.error) {
          console.error('Edge Function returned error:', data);
          let errorMessage = data.error;
          if (data.message) {
            errorMessage = data.message;
          }
          if (data.details && data.details.message) {
            errorMessage = data.details.message;
          }
          throw new Error(errorMessage);
        }

        if (data?.success) {
          const shareableUrl = data.payment_link_url;
          const snippeUrl = data.checkout_url;
          
          console.log('Payment link created:', data);
          console.log('Shareable URL:', shareableUrl);
          console.log('Snippe URL:', snippeUrl);
          
          toast.success(`Payment link created! Shareable: ${shareableUrl}`, { duration: 10000 });
          
          // Copy shareable link to clipboard
          if (shareableUrl) {
            navigator.clipboard.writeText(shareableUrl);
            toast.info("Shareable link copied to clipboard!", { duration: 5000 });
          }
          
          // Clear form
          setAmount(""); 
          setDescription(""); 
          setRecipientName(""); 
          setRecipientPhone("");
          setCreateOpen(false);
          
          // Refresh the links list immediately and after a delay
          fetchLinks();
          setTimeout(() => {
            fetchLinks();
          }, 2000);
        } else {
          console.error('Payment link creation failed:', data);
          let errorMessage = "Failed to create payment link";
          
          if (data?.details?.message) {
            errorMessage = data.details.message;
          } else if (data?.error) {
            errorMessage = data.error;
          } else if (data?.message) {
            errorMessage = data.message;
          }
          
          toast.error(errorMessage);
        }
      }
    } catch (err: any) {
      console.error('Payment link creation error:', err);
      toast.error(err.message || "Failed to create payment link. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('payment_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast.success("Payment link deleted successfully");
      setLinks(links.filter(l => l.id !== linkId));
      
      // Update stats
      const items = links.filter(l => l.id !== linkId);
      setStats({
        total: items.length,
        active: items.filter(l => l.status === "active").length,
        paid: items.filter(l => l.status === "paid").length,
        totalAmount: items.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0),
      });
    } catch (err: any) {
      console.error('Error deleting payment link:', err);
      toast.error("Failed to delete payment link");
    }
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Payment Link</DialogTitle>
              <DialogDescription>
                Generate a shareable link to collect payments via mobile money.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (TSh) <span className="text-destructive">*</span></Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="recipient-name">Customer Name</Label>
                  <Input
                    id="recipient-name"
                    placeholder="Optional"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="recipient-phone">Phone Number</Label>
                  <Input
                    id="recipient-phone"
                    type="tel"
                    placeholder="e.g. 0754123456"
                    value={recipientPhone}
                    onChange={e => setRecipientPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What is this payment for? (optional)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleCreateLink}
                disabled={creating || !amount || parseFloat(amount) <= 0}
                type="button"
              >
                {creating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</>
                ) : (
                  <><LinkIcon className="mr-2 h-4 w-4" />Generate Payment Link</>
                )}
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
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Links</CardTitle>
            <Button variant="outline" size="sm" onClick={fetchLinks}>
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12">
              <LinkIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground mb-2">No payment links yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first payment link to start collecting payments</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Link
              </Button>
            </div>
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
                      <TableCell className="font-mono text-xs">
                        {link.snippe_reference || link.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        TSh {link.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {link.recipient_name || "No name provided"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {link.recipient_phone || "No phone provided"}
                          </div>
                          {link.description && (
                            <div className="text-xs text-muted-foreground italic">
                              "{link.description}"
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(link.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(link.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 items-center">
                          <Button
                            size="icon"
                            variant="outline"
                            title="Copy payment link"
                            onClick={() => copyLink(link.checkout_url || `https://snippe.me/checkout/${link.snippe_reference}`)}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="destructive" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment Link</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this payment link? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end pt-2">
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteLink(link.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
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
