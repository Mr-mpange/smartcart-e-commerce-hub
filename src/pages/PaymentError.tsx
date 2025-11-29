import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle, RotateCcw, Home } from "lucide-react";

const PaymentError = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center border-destructive/50">
            <CardHeader className="space-y-4 pb-8">
              <div className="mx-auto">
                <XCircle className="h-16 w-16 md:h-20 md:w-20 text-destructive animate-in zoom-in duration-300" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl md:text-3xl">Payment Failed</CardTitle>
                <CardDescription className="text-base md:text-lg">
                  We couldn't process your payment
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-destructive/10 rounded-lg p-4 md:p-6">
                <p className="text-sm md:text-base text-foreground">
                  Your payment was not completed. This could be due to:
                </p>
                <ul className="mt-4 space-y-2 text-sm md:text-base text-muted-foreground text-left list-disc list-inside">
                  <li>Insufficient balance in your mobile money account</li>
                  <li>Incorrect PIN entered</li>
                  <li>Network connectivity issues</li>
                  <li>Payment timeout</li>
                </ul>
              </div>

              <div className="text-sm md:text-base text-muted-foreground">
                <p>
                  Don't worry, no charges were made to your account.
                  Please try again or contact support if the problem persists.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => navigate('/checkout')} 
                  className="flex-1"
                  size="lg"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => navigate('/')} 
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs md:text-sm text-muted-foreground">
                  Need help? Contact our support team at{" "}
                  <a href="mailto:support@smartcart.com" className="text-primary hover:underline">
                    support@smartcart.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PaymentError;
