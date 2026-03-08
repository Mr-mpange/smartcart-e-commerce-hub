import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DisputeChat } from "@/components/DisputeChat";
import {
  Loader2, Package, Truck, CheckCircle2, Clock, XCircle,
  Eye, Search, AlertTriangle, Shield, RotateCcw,
} from "lucide-react";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_address: string;
  phone_number: string;
  user_id: string;
  delivery_rider_id: string | null;
  dispute_status: string | null;
  dispute_reason: string | null;
  disputed_at: string | null;
  customer_name?: string;
}

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const disputeLabels: Record<string, string> = {
  pending: 'Pending Review',
  under_review: 'Under Review',
  resolved_refund: 'Refunded',
  resolved_release: 'Released to Seller',
  rejected: 'Rejected',
};

export function AdminOrderManagement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((o) => o.user_id))];
      let profilesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profilesMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      }

      setOrders(
        (data || []).map((o) => ({
          ...o,
          customer_name: profilesMap.get(o.user_id) || "Unknown",
        }))
      );
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;
      toast.success(`Order status updated to ${newStatus}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignRider = async (orderId: string, riderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ delivery_rider_id: riderId || null })
        .eq("id", orderId);

      if (error) throw error;
      toast.success("Delivery rider assigned");
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, delivery_rider_id: riderId || null } : o
        )
      );
    } catch (error: any) {
      toast.error("Failed to assign rider");
    }
  };

  const handleResolveDispute = async (orderId: string, action: 'refund' | 'release') => {
    setResolvingId(orderId);
    try {
      const order = orders.find(o => o.id === orderId);
      const shortId = orderId.slice(0, 8).toUpperCase();

      if (action === 'refund') {
        const { data: escrows, error: escrowError } = await supabase
          .from('escrows')
          .select('id')
          .eq('order_id', orderId)
          .eq('status', 'held');

        if (escrowError) throw escrowError;

        for (const escrow of escrows || []) {
          const { data: result, error: refundError } = await supabase
            .rpc('refund_escrow', { _escrow_id: escrow.id, _admin_id: user!.id });
          if (refundError) throw refundError;
        }

        await supabase.from('orders').update({
          dispute_status: 'resolved_refund',
          status: 'cancelled',
        }).eq('id', orderId);

        // SMS to buyer
        if (order?.phone_number) {
          await supabase.functions.invoke('briq-sms', {
            body: {
              phone_number: order.phone_number,
              message: `Your dispute for order #${shortId} has been resolved. A full refund has been issued to your wallet.`,
            },
          });
        }

        toast.success("Dispute resolved: funds refunded to buyer");
      } else {
        const { data: escrows, error: escrowError } = await supabase
          .from('escrows')
          .select('id')
          .eq('order_id', orderId)
          .eq('status', 'held');

        if (escrowError) throw escrowError;

        for (const escrow of escrows || []) {
          const { data: result, error: releaseError } = await supabase
            .rpc('release_escrow', { _escrow_id: escrow.id, _caller_id: user!.id });
          if (releaseError) throw releaseError;
        }

        await supabase.from('orders').update({
          dispute_status: 'resolved_release',
          status: 'delivered',
        }).eq('id', orderId);

        // SMS to buyer
        if (order?.phone_number) {
          await supabase.functions.invoke('briq-sms', {
            body: {
              phone_number: order.phone_number,
              message: `Your dispute for order #${shortId} has been reviewed. Funds have been released to the seller.`,
            },
          });
        }

        toast.success("Dispute resolved: funds released to seller");
      }

      fetchOrders();
    } catch (error: any) {
      console.error('Resolve dispute error:', error);
      toast.error(error.message || "Failed to resolve dispute");
    } finally {
      setResolvingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed":
      case "processing": return <Package className="h-4 w-4" />;
      case "shipped":
      case "out_for_delivery": return <Truck className="h-4 w-4" />;
      case "delivered": return <CheckCircle2 className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered": return "default";
      case "cancelled": return "destructive";
      case "pending": return "outline";
      default: return "secondary";
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone_number.includes(searchQuery);
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const disputedOrders = orders.filter(o => o.dispute_status && !['resolved_refund', 'resolved_release', 'rejected'].includes(o.dispute_status));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderOrdersTable = (ordersList: Order[]) => (
    <>
      {ordersList.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Dispute</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersList.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>{order.customer_name}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-semibold">
                    TSh {order.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="gap-1">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {order.dispute_status ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {disputeLabels[order.dispute_status] || order.dispute_status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end items-center">
                      {order.dispute_status === 'pending' || order.dispute_status === 'under_review' ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8"
                            onClick={() => handleResolveDispute(order.id, 'refund')}
                            disabled={resolvingId === order.id}
                          >
                            {resolvingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                            Refund
                          </Button>
                          <Button
                            size="sm"
                            className="text-xs h-8"
                            onClick={() => handleResolveDispute(order.id, 'release')}
                            disabled={resolvingId === order.id}
                          >
                            {resolvingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />}
                            Release
                          </Button>
                        </div>
                      ) : (
                        <Select
                          value={order.status}
                          onValueChange={(v) => handleStatusUpdate(order.id, v)}
                          disabled={updatingId === order.id}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Dispute Alert */}
      {disputedOrders.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold">{disputedOrders.length} active dispute(s) require attention</p>
              <p className="text-sm text-muted-foreground">Review and resolve disputed orders below</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Order Management</CardTitle>
          <CardDescription>Manage orders, resolve disputes, and assign delivery riders.</CardDescription>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Orders ({filteredOrders.length})</TabsTrigger>
              <TabsTrigger value="disputes" className="gap-2">
                <AlertTriangle className="h-3 w-3" />
                Disputes ({disputedOrders.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              {renderOrdersTable(filteredOrders)}
            </TabsContent>
            <TabsContent value="disputes">
              {renderOrdersTable(disputedOrders)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id.slice(0, 12)}...</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p>{selectedOrder.phone_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-bold text-primary">TSh {selectedOrder.total_amount.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Delivery Address</p>
                  <p>{selectedOrder.delivery_address}</p>
                </div>
              </div>

              {/* Dispute details in dialog */}
              {selectedOrder.dispute_status && (
                <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="font-medium text-sm">
                      Dispute: {disputeLabels[selectedOrder.dispute_status] || selectedOrder.dispute_status}
                    </p>
                  </div>
                  {selectedOrder.dispute_reason && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.dispute_reason}</p>
                  )}
                  {selectedOrder.disputed_at && (
                    <p className="text-xs text-muted-foreground">
                      Filed: {new Date(selectedOrder.disputed_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              {selectedOrder.dispute_status && (
                <DisputeChat orderId={selectedOrder.id} canSend={['pending', 'under_review'].includes(selectedOrder.dispute_status || '')} />
              )}

              <div className="space-y-2">
                <Label>Assign Delivery Rider (User ID)</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste rider user ID..."
                    defaultValue={selectedOrder.delivery_rider_id || ""}
                    id="rider-input"
                  />
                  <Button
                    onClick={() => {
                      const input = document.getElementById("rider-input") as HTMLInputElement;
                      handleAssignRider(selectedOrder.id, input.value);
                    }}
                  >
                    Assign
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
