import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RiderSidebar } from "@/components/RiderSidebar";
import { PaymentMonitoring } from "@/components/PaymentMonitoring";
import {
  Loader2, Truck, Package, CheckCircle2, Clock, MapPin, Phone, User, Navigation,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sendOrderStatusSMS } from "@/lib/sms";

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  phone_number: string;
  user_id: string;
  customer_name?: string;
  item_count?: number;
}

const riderStatusOptions = [
  { value: "shipped", label: "Picked Up / Shipped", icon: Package },
  { value: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { value: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function RiderDashboard() {
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "delivery_rider")) {
      navigate("/");
      return;
    }
    if (user && userRole === "delivery_rider") {
      fetchOrders();
      const channel = supabase
        .channel("rider-orders")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `delivery_rider_id=eq.${user.id}`,
          },
          () => fetchOrders()
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [user, userRole, authLoading]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authLoading && user && !userRole) {
        toast.error('Unable to determine user permissions. Please try logging in again.');
        navigate('/auth');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authLoading, user, userRole, navigate]);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("delivery_rider_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((data || []).map((o) => o.user_id))];
      let namesMap = new Map<string, string>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        namesMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);
      }

      // Get item counts
      const orderIds = (data || []).map((o) => o.id);
      let itemCountMap = new Map<string, number>();
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from("order_items")
          .select("order_id, quantity")
          .in("order_id", orderIds);
        (items || []).forEach((item) => {
          itemCountMap.set(item.order_id, (itemCountMap.get(item.order_id) || 0) + item.quantity);
        });
      }

      setOrders(
        (data || []).map((o) => ({
          ...o,
          customer_name: namesMap.get(o.user_id) || "Customer",
          item_count: itemCountMap.get(o.id) || 0,
        }))
      );
    } catch (err) {
      console.error("Error fetching rider orders:", err);
      toast.error("Failed to load deliveries");
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

      // Send SMS to customer
      const order = orders.find((o) => o.id === orderId);
      if (order) {
        sendOrderStatusSMS(orderId, newStatus as any, order.phone_number);
      }

      toast.success(`Status updated to ${statusLabels[newStatus]}`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (err: any) {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDirections = (address: string) => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
      "_blank"
    );
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "delivered": return "default";
      case "out_for_delivery": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));
  const completedOrders = orders.filter((o) => ["delivered", "cancelled"].includes(o.status));

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: orders.length,
    active: activeOrders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    today: orders.filter(
      (o) =>
        new Date(o.created_at).toDateString() === new Date().toDateString()
    ).length,
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(order.created_at).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </CardDescription>
          </div>
          <Badge variant={getStatusVariant(order.status)} className="shrink-0">
            {statusLabels[order.status] || order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted-foreground">{order.item_count} item(s) • TSh {order.total_amount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground">{order.delivery_address}</p>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <a href={`tel:${order.phone_number}`} className="text-primary hover:underline">
              {order.phone_number}
            </a>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openDirections(order.delivery_address)}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Directions
          </Button>

          {!["delivered", "cancelled"].includes(order.status) && (
            <Select
              value={order.status}
              onValueChange={(v) => handleStatusUpdate(order.id, v)}
              disabled={updatingId === order.id}
            >
              <SelectTrigger className="w-[180px] h-9 text-sm">
                {updatingId === order.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {riderStatusOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <s.icon className="h-3 w-3" />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Assigned", value: stats.total, icon: Package },
                { label: "Active Now", value: stats.active, icon: Truck },
                { label: "Delivered", value: stats.delivered, icon: CheckCircle2 },
                { label: "Today", value: stats.today, icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <Card key={label}>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{value}</p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Truck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No deliveries assigned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Orders will appear here once an admin assigns them to you.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {orders.slice(0, 5).map(renderOrderCard)}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'active':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Active Deliveries ({activeOrders.length})</h2>
            {activeOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No active deliveries</p>
            ) : (
              activeOrders.map(renderOrderCard)
            )}
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Completed Deliveries ({completedOrders.length})</h2>
            {completedOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No completed deliveries yet</p>
            ) : (
              completedOrders.map(renderOrderCard)
            )}
          </div>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No notifications yet</p>
            </CardContent>
          </Card>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Collection</h2>
            <PaymentMonitoring />
          </div>
        );

      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Settings panel coming soon</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <RiderSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">Rider Dashboard</h1>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}