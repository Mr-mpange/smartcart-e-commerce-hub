import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Loader2, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Payment Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [orderStatus, setOrderStatus] = useState<string>("pending");

  useEffect(() => {
    if (!orderId) return;

    // Fetch initial status
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();
      if (data) setOrderStatus(data.status);
    };
    fetchStatus();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`payment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setOrderStatus(newStatus);
          toast.success(
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>Order status: {statusLabels[newStatus] || newStatus}</span>
            </div>
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const isConfirmed = orderStatus !== "pending";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="space-y-4 pb-8">
              <div className="mx-auto">
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-primary animate-in zoom-in duration-300" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">
                  {isConfirmed ? "Payment Confirmed!" : "Order Placed!"}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {isConfirmed
                    ? "Your payment has been confirmed successfully"
                    : "Waiting for payment confirmation..."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Live Status */}
              <div className="bg-muted/50 rounded-lg p-4 md:p-6 flex items-center justify-center gap-3">
                {!isConfirmed && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                <Badge variant={isConfirmed ? "default" : "outline"} className="text-sm px-4 py-1.5">
                  {statusLabels[orderStatus] || orderStatus}
                </Badge>
                {!isConfirmed && (
                  <span className="text-xs text-muted-foreground">Live updates</span>
                )}
              </div>

              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 md:p-6">
                  <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                  <p className="font-mono text-base md:text-lg font-semibold break-all">
                    {orderId}
                  </p>
                </div>
              )}

              <div className="space-y-3 text-sm md:text-base text-muted-foreground">
                <p>
                  {isConfirmed
                    ? "Your order is being processed. You will receive SMS updates."
                    : "Check your phone to complete the mobile money payment. This page updates automatically."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Continue Shopping
                </Button>
                {orderId && (
                  <Button
                    onClick={() => navigate(`/order/${orderId}`)}
                    className="flex-1"
                    size="lg"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Track Order
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
