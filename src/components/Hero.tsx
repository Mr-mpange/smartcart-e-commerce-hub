import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ShoppingBag, Shield, Truck, CreditCard } from "lucide-react";

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <ShoppingBag className="h-4 w-4" />
              <span>#1 Multi-Vendor Marketplace in East Africa</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Shop Smart,
              <span className="block text-primary mt-2">Live Better</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Discover thousands of products from 500+ verified vendors. Fast delivery, secure payments, and unbeatable deals all in one place.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                onClick={() => navigate('/products')}
              >
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate('/vendors')}
              >
                Become a Vendor
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-6 pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Truck className="h-5 w-5 text-primary" />
                <span>Free Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Buyer Protection</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-5 w-5 text-primary" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>

          {/* Hero Image Grid */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                  <img
                    src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
                    alt="Premium headphones"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                  <img
                    src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop"
                    alt="Smart watch"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="rounded-2xl overflow-hidden shadow-lg h-64">
                  <img
                    src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop"
                    alt="Nike shoes"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden shadow-lg h-48">
                  <img
                    src="https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop"
                    alt="Camera"
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </div>
              </div>
            </div>
            
            {/* Stats Floating Card */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-card p-4 rounded-xl shadow-xl border flex gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">10K+</div>
                <div className="text-xs text-muted-foreground">Products</div>
              </div>
              <div className="text-center border-l pl-8">
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-xs text-muted-foreground">Vendors</div>
              </div>
              <div className="text-center border-l pl-8">
                <div className="text-2xl font-bold text-primary">50K+</div>
                <div className="text-xs text-muted-foreground">Customers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
