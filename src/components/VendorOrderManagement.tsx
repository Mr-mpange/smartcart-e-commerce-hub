import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Package, MapPin, Phone, Loader2, CheckCircle2, Clock, Truck, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  image_url: string | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_address: string;
  phone_number: string;
  user_id: string;
}

interface VendorOrder {
  order_item_id: string;
  order_id: string;
  product_id: string | null;
  quantity: number;
  price: number;
  created_at: string;
  order: Order;
  product: Product | null;
  customer_name: string;
}

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function VendorOrderManagement() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVendorOrders();

      // Set up realtime subscription for order_items updates
      const channel = supabase
        .channel('vendor-orders')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'order_items',
            filter: `vendor_id=eq.${user.id}`,
          },
          () => {
            fetchVendorOrders();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchVendorOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchVendorOrders = async () => {
    if (!user) return;

    try {
      // Fetch order items for this vendor
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      if (!orderItems || orderItems.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(item => item.order_id))];
      
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds);

      if (ordersError) throw ordersError;

      // Fetch products
      const productIds = [...new Set(orderItems.map(item => item.product_id).filter(Boolean))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds as string[]);

      // Fetch customer profiles
      const userIds = [...new Set(ordersData?.map(order => order.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      // Map everything together
      const ordersMap = new Map(ordersData?.map(o => [o.id, o]) || []);
      const productsMap = new Map(productsData?.map(p => [p.id, p]) || []);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      const vendorOrders: VendorOrder[] = orderItems.map(item => {
        const order = ordersMap.get(item.order_id);
        const product = productsMap.get(item.product_id || '');
        const profile = profilesMap.get(order?.user_id || '');

        return {
          order_item_id: item.id,
          order_id: item.order_id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
          created_at: item.created_at,
          order: order as Order,
          product: product || null,
          customer_name: profile?.full_name || 'Customer',
        };
      });

      setOrders(vendorOrders);
    } catch (error: any) {
      console.error('Error fetching vendor orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state
      setOrders(prev => prev.map(order => 
        order.order_id === orderId 
          ? { ...order, order: { ...order.order, status: newStatus } }
          : order
      ));

      toast.success('Order status updated');
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'shipped':
      case 'out_for_delivery':
        return <Truck className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
      case 'out_for_delivery':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Group orders by order_id for display
  const groupedOrders = orders.reduce((acc, order) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = [];
    }
    acc[order.order_id].push(order);
    return acc;
  }, {} as Record<string, VendorOrder[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
        <p className="text-muted-foreground">Orders will appear here when customers purchase your products</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {Object.entries(groupedOrders).map(([orderId, items]) => {
          const orderInfo = items[0].order;
          const customerName = items[0].customer_name;
          const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
          const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          return (
            <Card key={orderId} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      Order #{orderId.slice(0, 8).toUpperCase()}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {customerName} • {new Date(orderInfo.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusVariant(orderInfo.status)} className="flex items-center gap-1">
                      {getStatusIcon(orderInfo.status)}
                      <span className="capitalize">{orderInfo.status.replace('_', ' ')}</span>
                    </Badge>
                    <Select
                      value={orderInfo.status}
                      onValueChange={(value) => handleStatusUpdate(orderId, value)}
                      disabled={updatingStatus === orderId}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.order_item_id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={item.product?.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=60'}
                              alt={item.product?.name || 'Product'}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <span className="font-medium">{item.product?.name || 'Product'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">TSh {item.price.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium">
                          TSh {(item.price * item.quantity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{orderInfo.delivery_address}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{orderInfo.phone_number}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{totalItems} item(s)</p>
                    <p className="text-lg font-bold text-primary">TSh {totalValue.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(items[0])}
                  >
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Order #{selectedOrder?.order_id.slice(0, 8).toUpperCase()}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(selectedOrder.order.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Delivery Address</p>
                <p className="font-medium">{selectedOrder.order.delivery_address}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Phone Number</p>
                <p className="font-medium">{selectedOrder.order.phone_number}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Payment Method</p>
                <p className="font-medium capitalize">
                  {selectedOrder.order.payment_method.replace('_', ' ')}
                </p>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-medium">Status</span>
                <Badge variant={getStatusVariant(selectedOrder.order.status)}>
                  {selectedOrder.order.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}