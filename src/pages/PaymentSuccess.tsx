import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package, Loader2, Bell, Smartphone, ShieldCheck, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Payment Confirmed",
  failed: "Payment Failed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  paid: "Payment Received",
  active: "Active",
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const slug = searchParams.get("slug");
  const paymentMethod = searchParams.get("method");
  const provider = searchParams.get("provider") || 'Mobile Money';
  const [orderStatus, setOrderStatus] = useState<string>("pending");
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      // Handle payment link
      fetchPaymentLink();
    } else if (orderId) {
      // Handle order
      fetchOrderStatus();
    } else {
      setLoading(false);
    }
  }, [orderId, slug]);

  const fetchPaymentLink = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(
        `${supabaseUrl}/rest/v1/payment_links?slug=eq.${slug}&select=*`,
        {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Content-Type': 'application/json',
          }
        }
      );

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setPaymentLink(data[0]);
        setOrderStatus(data[0].status);
      }
    } catch (err) {
      console.error('Error fetching payment link:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const { data } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();
      if (data) setOrderStatus(data.status);
    } catch (err) {
      console.error('Error fetching order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId && !slug) return;

    const channel = supabase
      .channel(`payment-${orderId || slug}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: orderId ? "orders" : "payment_links",
          filter: orderId ? `id=eq.${orderId}` : `slug=eq.${slug}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          setOrderStatus(newStatus);
          if (newStatus === "confirmed" || newStatus === "paid") {
            toast.success("Payment confirmed! Thank you for your payment.");
          } else if (newStatus === "failed") {
            toast.error("Payment failed. Please try again.");
          } else {
            toast.info(`Status: ${statusLabels[newStatus] || newStatus}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, slug]);

  const isPending = orderStatus === "pending" || orderStatus === "active";
  const isConfirmed = orderStatus === "confirmed" || orderStatus === "paid" || orderStatus === "processing" || orderStatus === "shipped" || orderStatus === "delivered";
  const isFailed = orderStatus === "failed";
  const isMobileMoney = paymentMethod === "mobile_money";
  const isPaymentLink = !!slug;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

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
                    ? isPaymentLink ? "Waiting for Payment" : "Confirm Payment on Your Phone"
                    : isFailed
                    ? "Payment Failed"
                    : isPaymentLink ? "Payment Received!" : "Payment Confirmed!"}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {isPending && isMobileMoney && !isPaymentLink
                    ? `A payment push has been sent to your phone. Enter your ${provider.includes('M-Pesa') ? 'M-Pesa' : provider.includes('Airtel') ? 'Airtel Money' : provider.includes('Tigo') ? 'Tigo Pesa' : provider.includes('Halotel') ? 'Halotel' : 'mobile money'} PIN to authorize.`
                    : isPending
                    ? isPaymentLink ? "Payment is being processed. This page will update automatically." : "Waiting for payment confirmation..."
                    : isFailed
                    ? "The payment was not completed. You can try again."
                    : isPaymentLink ? "Thank you! Your payment has been successfully received." : "Your payment is confirmed. Funds are held in escrow until you receive your order."}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Pending: show step-by-step instructions */}
              {isPending && isMobileMoney && !isPaymentLink && (
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
              {isConfirmed && !isPaymentLink && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p>
                    Your payment is safely held in <strong>escrow</strong>. The seller will NOT receive the money until you confirm delivery in your orders page.
                  </p>
                </div>
              )}

              {/* Payment Link Details */}
              {isPaymentLink && paymentLink && (
                <div className="bg-muted/50 rounded-lg p-4 md:p-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount Received</p>
                    <p className="text-2xl font-bold text-primary">
                      TSh {paymentLink.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Reference</p>
                    <p className="font-mono text-sm break-all">{paymentLink.snippe_reference}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Shareable Link</p>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={`https://uzanasi.online/pay/${slug}`}
                        readOnly
                        className="flex-1 px-3 py-2 border rounded text-xs bg-white font-mono"
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://uzanasi.online/pay/${slug}`);
                          toast.success("Link copied!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
                  {isPaymentLink ? "Go Home" : "Continue Shopping"}
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
