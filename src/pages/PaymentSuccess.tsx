import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Package } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Optional: Verify payment status with backend
  }, [orderId]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardHeader className="space-y-4 pb-8">
              <div className="mx-auto">
                <CheckCircle2 className="h-16 w-16 md:h-20 md:w-20 text-success animate-in zoom-in duration-300" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">Payment Successful!</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  Your order has been placed successfully
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
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
                  We've received your payment and your order is being processed.
                </p>
                <p>
                  You will receive an SMS confirmation shortly with your order details.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Continue Shopping
                </Button>
                <Button 
                  onClick={() => navigate('/orders')} 
                  className="flex-1"
                  size="lg"
                >
                  <Package className="mr-2 h-4 w-4" />
                  View Orders
                </Button>
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
