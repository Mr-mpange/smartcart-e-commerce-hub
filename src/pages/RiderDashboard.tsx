import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "delivery_rider")) {
      navigate("/");
      return;
    }
    if (user) {
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <Truck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">My Deliveries</h1>
              <p className="text-sm text-muted-foreground">Manage your assigned delivery orders</p>
            </div>
          </div>

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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">
                  Active ({activeOrders.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedOrders.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-4 mt-4">
                {activeOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No active deliveries</p>
                ) : (
                  activeOrders.map(renderOrderCard)
                )}
              </TabsContent>
              <TabsContent value="completed" className="space-y-4 mt-4">
                {completedOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No completed deliveries yet</p>
                ) : (
                  completedOrders.map(renderOrderCard)
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
