import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Package, Clock, CheckCircle2, XCircle, Truck, MapPin, Phone, Loader2, ArrowLeft, Bell } from "lucide-react";
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
  updated_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_address: string;
  phone_number: string;
  user_id: string;
  order_items?: OrderItem[];
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

const statusDescriptions: Record<string, string> = {
  pending: 'Your order has been received and is awaiting confirmation.',
  confirmed: 'Your order has been confirmed and is being prepared.',
  processing: 'Your order is being packed and prepared for shipping.',
  shipped: 'Your order has been shipped and is on its way.',
  out_for_delivery: 'Your order is out for delivery and will arrive soon.',
  delivered: 'Your order has been delivered successfully!',
  cancelled: 'This order has been cancelled.',
};

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchOrder();
      
      // Set up realtime subscription for this specific order
      const channel = supabase
        .channel(`order-${id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${id}`,
          },
          (payload) => {
            setOrder((prev) => prev ? { ...prev, ...payload.new } : null);
            toast.success(
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Status updated: {statusLabels[payload.new.status] || payload.new.status}</span>
              </div>
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  const fetchOrder = async () => {
    if (!id) return;

    try {
      // Fetch the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

      // Check if user owns this order (if logged in)
      if (user && orderData.user_id !== user.id) {
        setError('You do not have permission to view this order.');
        setLoading(false);
        return;
      }

      // Fetch order items
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, quantity, price, product_id')
        .eq('order_id', id);

      if (itemsError) throw itemsError;

      // Fetch products for order items
      const productIds = orderItems?.map(item => item.product_id).filter(Boolean) || [];
      let productsMap = new Map();

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', productIds as string[]);
        
        productsMap = new Map(products?.map(p => [p.id, p]) || []);
      }

      const orderWithItems: Order = {
        ...orderData,
        order_items: orderItems?.map(item => ({
          ...item,
          product: productsMap.get(item.product_id || '') || null,
        })),
      };

      setOrder(orderWithItems);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError('Order not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStep = (status: string) => {
    const index = statusSteps.indexOf(status);
    return index === -1 ? 0 : index;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5" />;
      case "shipped":
      case "out_for_delivery":
        return <Truck className="h-5 w-5" />;
      case "cancelled":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-6 text-center">{error || 'This order does not exist.'}</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStep = getCurrentStep(order.status);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                    <Package className="h-7 w-7" />
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </CardDescription>
                </div>
                <Badge 
                  variant={getStatusVariant(order.status)}
                  className="w-fit flex items-center gap-1.5 text-sm px-3 py-1.5"
                >
                  {getStatusIcon(order.status)}
                  <span className="capitalize">{statusLabels[order.status] || order.status}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Status Description */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-lg">{statusDescriptions[order.status]}</p>
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <p className="text-sm text-muted-foreground mt-2">
                    You'll receive SMS updates when your order status changes.
                  </p>
                )}
              </div>

              {/* Progress Tracker */}
              {order.status !== 'cancelled' && (
                <div className="py-4">
                  <div className="relative flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStep;
                      const isCurrent = index === currentStep;
                      
                      return (
                        <div 
                          key={step} 
                          className="flex flex-col items-center flex-1 relative"
                        >
                          {/* Connecting line */}
                          {index > 0 && (
                            <div 
                              className={`absolute top-5 right-1/2 w-full h-1 -z-10 ${
                                index <= currentStep ? 'bg-primary' : 'bg-muted'
                              }`}
                            />
                          )}
                          
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted 
                                ? 'bg-primary text-primary-foreground shadow-lg' 
                                : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/30 scale-110' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <span className="text-sm font-medium">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-2 text-center font-medium ${
                            isCompleted ? 'text-primary' : 'text-muted-foreground'
                          } hidden sm:block`}>
                            {statusLabels[step]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Mobile step label */}
                  <p className="text-center mt-4 font-medium sm:hidden">
                    {statusLabels[order.status]}
                  </p>
                </div>
              )}

              <Separator />

              {/* Order Items */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Order Items</h3>
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <img
                      src={item.product?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80'}
                      alt={item.product?.name || 'Product'}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-lg">{item.product?.name || 'Product'}</p>
                      <p className="text-muted-foreground">
                        Qty: {item.quantity} × TSh {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-primary">
                      TSh {(item.quantity * item.price).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-dashed">
                  <CardContent className="p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Delivery Address</p>
                      <p className="text-muted-foreground">{order.delivery_address}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-dashed">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Contact Number</p>
                      <p className="text-muted-foreground">{order.phone_number}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="bg-muted/30 rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">{order.payment_method.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>TSh {(order.total_amount - 5000).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>TSh 5,000</span>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    TSh {order.total_amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Need help with your order? Contact our support team.
              </p>
              <Button variant="outline">Contact Support</Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderTracking;
