import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Package, Clock, CheckCircle2, XCircle, Truck, MapPin, Phone,
  Loader2, ArrowLeft, Bell, User, Bike, Car, Navigation,
} from "lucide-react";
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

interface RiderInfo {
  full_name: string;
  phone: string;
  vehicle_type: string;
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
  delivery_rider_id: string | null;
  order_items?: OrderItem[];
  rider?: RiderInfo | null;
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
  shipped: 'Your order has been picked up by the delivery rider.',
  out_for_delivery: 'Your rider is on the way! Your order will arrive soon.',
  delivered: 'Your order has been delivered successfully!',
  cancelled: 'This order has been cancelled.',
};

const vehicleIcons: Record<string, typeof Bike> = {
  motorcycle: Bike,
  bicycle: Bike,
  car: Car,
  van: Truck,
};

function getEstimatedTime(status: string, updatedAt: string): string | null {
  if (['delivered', 'cancelled', 'pending', 'confirmed', 'processing'].includes(status)) return null;
  const updated = new Date(updatedAt);
  if (status === 'shipped') {
    const est = new Date(updated.getTime() + 60 * 60 * 1000); // +1hr
    return `Est. delivery by ${est.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  if (status === 'out_for_delivery') {
    const est = new Date(updated.getTime() + 30 * 60 * 1000); // +30min
    return `Arriving by ${est.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  return null;
}

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
            const newData = payload.new as any;
            setOrder((prev) => prev ? { ...prev, ...newData } : null);
            // Re-fetch rider if rider was just assigned
            if (newData.delivery_rider_id && (!order?.delivery_rider_id || newData.delivery_rider_id !== order?.delivery_rider_id)) {
              fetchRiderInfo(newData.delivery_rider_id);
            }
            toast.success(
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>Status updated: {statusLabels[newData.status] || newData.status}</span>
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

  const fetchRiderInfo = async (riderId: string) => {
    const { data } = await supabase
      .from('rider_profiles')
      .select('full_name, phone, vehicle_type')
      .eq('user_id', riderId)
      .single();
    if (data) {
      setOrder((prev) => prev ? { ...prev, rider: data } : null);
    }
  };

  const fetchOrder = async () => {
    if (!id) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (orderError) throw orderError;

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

      const productIds = orderItems?.map(item => item.product_id).filter(Boolean) || [];
      let productsMap = new Map();

      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, image_url')
          .in('id', productIds as string[]);
        productsMap = new Map(products?.map(p => [p.id, p]) || []);
      }

      // Fetch rider info
      let riderInfo: RiderInfo | null = null;
      if (orderData.delivery_rider_id) {
        const { data: rider } = await supabase
          .from('rider_profiles')
          .select('full_name, phone, vehicle_type')
          .eq('user_id', orderData.delivery_rider_id)
          .single();
        riderInfo = rider;
      }

      setOrder({
        ...orderData,
        order_items: orderItems?.map(item => ({
          ...item,
          product: productsMap.get(item.product_id || '') || null,
        })),
        rider: riderInfo,
      });
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
      case "delivered": return <CheckCircle2 className="h-5 w-5" />;
      case "shipped":
      case "out_for_delivery": return <Truck className="h-5 w-5" />;
      case "cancelled": return <XCircle className="h-5 w-5" />;
      default: return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered": return "default";
      case "shipped":
      case "out_for_delivery": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
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
  const estimatedTime = getEstimatedTime(order.status, order.updated_at);
  const VehicleIcon = vehicleIcons[order.rider?.vehicle_type || ''] || Truck;

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
                      year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
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
              {/* Status Description + ETA */}
              <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
                <p className="text-lg">{statusDescriptions[order.status]}</p>
                {estimatedTime && (
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {estimatedTime}
                  </div>
                )}
                {order.status !== 'cancelled' && order.status !== 'delivered' && !estimatedTime && (
                  <p className="text-sm text-muted-foreground">
                    You'll receive SMS updates when your order status changes.
                  </p>
                )}
              </div>

              {/* Rider Info Card */}
              {order.rider && ['shipped', 'out_for_delivery'].includes(order.status) && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/30">
                          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                            {order.rider.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-base">{order.rider.full_name}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <VehicleIcon className="h-3.5 w-3.5" />
                            <span className="capitalize">{order.rider.vehicle_type}</span>
                            <span>•</span>
                            <span>Your Delivery Rider</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a href={`tel:${order.rider.phone}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!order.rider && order.delivery_rider_id && ['shipped', 'out_for_delivery'].includes(order.status) && (
                <Card className="border-dashed">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">A rider has been assigned to your order.</p>
                  </CardContent>
                </Card>
              )}

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
                  <span>TSh {(order.total_amount - 500).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span>TSh 500</span>
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
