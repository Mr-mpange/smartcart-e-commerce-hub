import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle2, XCircle, Truck, MapPin, Phone, Loader2, Shield, AlertTriangle, MessageSquare } from "lucide-react";
import { DisputeChat } from "@/components/DisputeChat";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product_id: string | null;
  product?: {
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_address: string;
  phone_number: string;
  dispute_status: string | null;
  dispute_reason: string | null;
  order_items?: OrderItem[];
  escrow_status?: string;
  escrow_id?: string;
}

const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

const statusLabels: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const disputeLabels: Record<string, string> = {
  pending: 'Dispute Pending',
  under_review: 'Under Review',
  resolved_refund: 'Refunded',
  resolved_release: 'Resolved (Released to Seller)',
  rejected: 'Dispute Rejected',
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [disputeDialog, setDisputeDialog] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();

    const channel = supabase
      .channel('user-orders')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === payload.new.id ? { ...order, ...payload.new } : order
            )
          );
          toast.success(`Order ${(payload.new as any).id.slice(0, 8)} status updated to ${statusLabels[(payload.new as any).status] || (payload.new as any).status}`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            quantity,
            price,
            product_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithProducts = await Promise.all(
        (data || []).map(async (order) => {
          const productIds = order.order_items?.map((item: OrderItem) => item.product_id).filter(Boolean) || [];
          let orderWithProducts = order;
          
          if (productIds.length > 0) {
            const { data: products } = await supabase
              .from('products')
              .select('id, name, image_url')
              .in('id', productIds);

            const productsMap = new Map(products?.map((p) => [p.id, p]) || []);
            orderWithProducts = {
              ...order,
              order_items: order.order_items?.map((item: OrderItem) => ({
                ...item,
                product: productsMap.get(item.product_id || '') || null,
              })),
            };
          }

          const { data: escrowData } = await supabase
            .from('escrows')
            .select('id, status')
            .eq('order_id', order.id)
            .eq('buyer_id', user.id)
            .limit(1);

          return {
            ...orderWithProducts,
            escrow_status: escrowData?.[0]?.status || null,
            escrow_id: escrowData?.[0]?.id || null,
          };
        })
      );

      setOrders(ordersWithProducts as any);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const { data: escrowsData, error: escrowError } = await supabase
        .from('escrows')
        .select('id')
        .eq('order_id', orderId)
        .eq('buyer_id', user!.id)
        .eq('status', 'held');

      if (escrowError) throw escrowError;

      for (const escrow of escrowsData || []) {
        const { data: released, error: releaseError } = await supabase
          .rpc('release_escrow', { _escrow_id: escrow.id, _caller_id: user!.id });
        if (releaseError) throw releaseError;
      }

      await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId);

      toast.success("Delivery confirmed! Funds released to seller.");
      fetchOrders();
    } catch (err: any) {
      console.error('Confirm delivery error:', err);
      toast.error("Failed to confirm delivery");
    }
  };

  const handleSubmitDispute = async () => {
    if (!disputeDialog || !disputeReason.trim()) {
      toast.error("Please provide a reason for the dispute");
      return;
    }

    setSubmittingDispute(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          dispute_status: 'pending',
          dispute_reason: disputeReason.trim(),
          disputed_at: new Date().toISOString(),
        })
        .eq('id', disputeDialog)
        .eq('user_id', user!.id);

      if (error) throw error;

      toast.success("Dispute submitted. Our team will review it shortly.");
      setDisputeDialog(null);
      setDisputeReason('');
      fetchOrders();
    } catch (err: any) {
      console.error('Dispute error:', err);
      toast.error("Failed to submit dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4" />;
      case "shipped":
      case "out_for_delivery":
        return <Truck className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered":
        return "default";
      case "shipped":
      case "out_for_delivery":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getCurrentStep = (status: string) => {
    const index = statusSteps.indexOf(status);
    return index === -1 ? 0 : index;
  };

  const canDispute = (order: Order) => {
    return (
      order.escrow_status === 'held' &&
      order.status !== 'cancelled' &&
      order.status !== 'delivered' &&
      !order.dispute_status
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2">
            <Package className="h-8 w-8" />
            My Orders
          </h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground mb-4">No orders yet</p>
                <Button onClick={() => navigate('/products')}>Start Shopping</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <CardHeader className="cursor-pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg md:text-xl">
                          Order #{order.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <CardDescription>
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={getStatusVariant(order.status)}
                          className="w-fit flex items-center gap-1"
                        >
                          {getStatusIcon(order.status)}
                          <span className="capitalize">{statusLabels[order.status] || order.status}</span>
                        </Badge>
                        {order.dispute_status && (
                          <Badge variant="destructive" className="w-fit flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {disputeLabels[order.dispute_status] || order.dispute_status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Progress Tracker */}
                    {order.status !== 'cancelled' && (
                      <div className="relative">
                        <div className="flex justify-between mb-2">
                          {statusSteps.map((step, index) => {
                            const currentStep = getCurrentStep(order.status);
                            const isCompleted = index <= currentStep;
                            const isCurrent = index === currentStep;
                            
                            return (
                              <div 
                                key={step} 
                                className={`flex flex-col items-center flex-1 ${index > 0 ? 'relative' : ''}`}
                              >
                                <div 
                                  className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                                    isCompleted 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted text-muted-foreground'
                                  } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                  ) : (
                                    <span className="text-xs">{index + 1}</span>
                                  )}
                                </div>
                                <span className="text-xs mt-1 text-center hidden sm:block">
                                  {statusLabels[step]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted -z-0">
                          <div 
                            className="h-full bg-primary transition-all duration-500"
                            style={{ 
                              width: `${(getCurrentStep(order.status) / (statusSteps.length - 1)) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedOrder === order.id && (
                      <>
                        <Separator />
                        
                        {/* Order Items */}
                        <div className="space-y-3">
                          <h4 className="font-semibold">Order Items</h4>
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                              <img
                                src={item.product?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                                alt={item.product?.name || 'Product'}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{item.product?.name || 'Product'}</p>
                                <p className="text-sm text-muted-foreground">
                                  Qty: {item.quantity} × TSh {item.price.toLocaleString()}
                                </p>
                              </div>
                              <p className="font-semibold">
                                TSh {(item.quantity * item.price).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        {/* Delivery Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Delivery Address</p>
                              <p className="text-sm text-muted-foreground">{order.delivery_address}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">Phone Number</p>
                              <p className="text-sm text-muted-foreground">{order.phone_number}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Payment & Total */}
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold text-primary">
                              TSh {order.total_amount.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Escrow Status & Actions */}
                        {order.escrow_status === 'held' && order.status !== 'delivered' && order.status !== 'cancelled' && !order.dispute_status && (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2">
                              <Shield className="h-5 w-5 text-amber-600" />
                              <div>
                                <p className="font-medium text-sm">Funds held in escrow</p>
                                <p className="text-xs text-muted-foreground">Confirm delivery or raise a dispute</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => { setDisputeDialog(order.id); setDisputeReason(''); }}>
                                <AlertTriangle className="mr-1 h-4 w-4" />
                                Dispute
                              </Button>
                              <Button size="sm" onClick={() => handleConfirmDelivery(order.id)}>
                                <CheckCircle2 className="mr-1 h-4 w-4" />
                                Confirm Delivery
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Active dispute info */}
                        {order.dispute_status && (
                          <div className="space-y-3">
                            <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                <p className="font-medium text-sm">
                                  {disputeLabels[order.dispute_status] || order.dispute_status}
                                </p>
                              </div>
                              {order.dispute_reason && (
                                <p className="text-sm text-muted-foreground">
                                  <strong>Reason:</strong> {order.dispute_reason}
                                </p>
                              )}
                              {order.dispute_status === 'resolved_refund' && (
                                <p className="text-sm text-primary">Funds have been refunded to your wallet.</p>
                              )}
                            </div>
                            <DisputeChat
                              orderId={order.id}
                              canSend={['pending', 'under_review'].includes(order.dispute_status || '')}
                            />
                          </div>
                        )}

                        {order.escrow_status === 'released' && !order.dispute_status && (
                          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <p className="text-sm text-green-700 dark:text-green-400">Payment released to seller</p>
                          </div>
                        )}

                        {order.escrow_status === 'refunded' && (
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <Shield className="h-4 w-4 text-blue-600" />
                            <p className="text-sm text-blue-700 dark:text-blue-400">Funds refunded to your wallet</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Summary when collapsed */}
                    {expandedOrder !== order.id && (
                      <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">
                          {order.order_items?.length || 0} item(s)
                        </p>
                        <p className="text-xl font-bold text-primary">
                          TSh {order.total_amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Dispute Dialog */}
      <Dialog open={!!disputeDialog} onOpenChange={() => setDisputeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Dispute Order
            </DialogTitle>
            <DialogDescription>
              Explain why you're disputing this order. Your funds will remain in escrow while our team reviews your case.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe the issue: wrong item received, item not delivered, damaged product, etc."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisputeDialog(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleSubmitDispute}
              disabled={submittingDispute || !disputeReason.trim()}
            >
              {submittingDispute ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit Dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Orders;
