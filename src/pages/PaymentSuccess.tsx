import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Loader2, Bell, Smartphone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Payment Confirmed",
  failed: "Payment Failed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const paymentMethod = searchParams.get("method");
  const provider = searchParams.get("provider") || 'Mobile Money';
  const [orderStatus, setOrderStatus] = useState<string>("pending");

  useEffect(() => {
    if (!orderId) return;

    const fetchStatus = async () => {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();
      if (data) setOrderStatus(data.status);
    };
    fetchStatus();

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
          if (newStatus === "confirmed") {
            toast.success("Payment confirmed! Your funds are held safely in escrow until delivery.");
          } else if (newStatus === "failed") {
            toast.error("Payment failed. Please try again.");
          } else {
            toast.info(`Order status: ${statusLabels[newStatus] || newStatus}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  const isPending = orderStatus === "pending";
  const isConfirmed = orderStatus === "confirmed" || orderStatus === "processing" || orderStatus === "shipped" || orderStatus === "delivered";
  const isFailed = orderStatus === "failed";
  const isMobileMoney = paymentMethod === "mobile_money";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="space-y-4 pb-8">
              <div className="mx-auto">
                {isPending ? (
                  <Smartphone className="h-16 w-16 md:h-20 md:w-20 text-primary animate-pulse" />
                ) : isFailed ? (
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <span className="text-3xl">✕</span>
                  </div>
                ) : (
                  <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-primary animate-in zoom-in duration-300" />
                )}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">
                  {isPending
                    ? "Confirm Payment on Your Phone"
                    : isFailed
                    ? "Payment Failed"
                    : "Payment Confirmed!"}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {isPending && isMobileMoney
                    ? `A payment push has been sent to your phone. Enter your ${provider.includes('M-Pesa') ? 'M-Pesa' : provider.includes('Airtel') ? 'Airtel Money' : provider.includes('Tigo') ? 'Tigo Pesa' : provider.includes('Halotel') ? 'Halotel' : 'mobile money'} PIN to authorize.`
                    : isPending
                    ? "Waiting for payment confirmation..."
                    : isFailed
                    ? "The payment was not completed. You can try again from your orders."
                    : "Your payment is confirmed. Funds are held in escrow until you receive your order."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Pending: show step-by-step instructions */}
              {isPending && isMobileMoney && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 md:p-6 text-left space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-primary" />
                    Complete Payment
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Check your phone for the <strong>USSD payment prompt</strong></li>
                    <li>Enter your <strong>mobile money PIN</strong> to authorize</li>
                    <li>This page will update <strong>automatically</strong> once confirmed</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Your money is protected — funds are held in escrow and only released to the seller after you confirm delivery.
                  </p>
                </div>
              )}

              {/* Live Status Badge */}
              <div className="bg-muted/50 rounded-lg p-4 md:p-6 flex items-center justify-center gap-3">
                {isPending && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                {isConfirmed && <ShieldCheck className="h-5 w-5 text-primary" />}
                <Badge
                  variant={isConfirmed ? "default" : isFailed ? "destructive" : "outline"}
                  className="text-sm px-4 py-1.5"
                >
                  {statusLabels[orderStatus] || orderStatus}
                </Badge>
                {isPending && (
                  <span className="text-xs text-muted-foreground">Live updates</span>
                )}
              </div>

              {/* Escrow info after confirmation */}
              {isConfirmed && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>
                    Your payment is safely held in <strong>escrow</strong>. The seller will NOT receive the money until you confirm delivery in your orders page.
                  </p>
                </div>
              )}

              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 md:p-6">
                  <p className="text-sm text-muted-foreground mb-2">Order ID</p>
                  <p className="font-mono text-base md:text-lg font-semibold break-all">
                    {orderId}
                  </p>
                </div>
              )}

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
                {isFailed && (
                  <Button
                    onClick={() => navigate("/orders")}
                    variant="destructive"
                    className="flex-1"
                    size="lg"
                  >
                    View Orders
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
