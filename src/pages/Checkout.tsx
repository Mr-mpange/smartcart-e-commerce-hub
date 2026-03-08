import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Loader2, ShoppingBag, CreditCard, Smartphone, MapPin, AlertCircle, RotateCcw } from "lucide-react";

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    vendor_id: string;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loadingCart, setLoadingCart] = useState(true);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    paymentMethod: "mobile_money",
  });

  useEffect(() => {
    if (user) {
      fetchCartItems();
      fetchUserProfile();
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url,
            vendor_id
          )
        `)
        .eq('user_id', user?.id);

      if (error) throw error;
      setCartItems(data as any || []);
    } catch (error: any) {
      toast.error('Failed to load cart');
    } finally {
      setLoadingCart(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user?.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          name: profile.full_name || '',
          phone: profile.phone || '',
          email: user?.email || '',
        }));
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = 5000;
  const total = subtotal + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setPaymentError(null);
    
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setIsLoading(true);

    try {
      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user?.id,
          total_amount: total,
          delivery_address: formData.address,
          phone_number: formData.phone,
          payment_method: formData.paymentMethod,
          status: 'pending',
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        vendor_id: item.product.vendor_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Create escrow entries per vendor
      const vendorTotals = new Map<string, number>();
      cartItems.forEach(item => {
        const current = vendorTotals.get(item.product.vendor_id) || 0;
        vendorTotals.set(item.product.vendor_id, current + (item.product.price * item.quantity));
      });

      const COMMISSION_RATE = 0.05;
      for (const [vendorId, vendorAmount] of vendorTotals) {
        const commissionAmount = Math.round(vendorAmount * COMMISSION_RATE);
        await supabase.from('escrows').insert({
          order_id: order.id,
          buyer_id: user?.id,
          vendor_id: vendorId,
          amount: vendorAmount,
          commission_rate: COMMISSION_RATE,
          commission_amount: commissionAmount,
          status: 'held',
        });
      }

      // Process payment based on method
      if (formData.paymentMethod === 'mobile_money') {
        const { data, error } = await supabase.functions.invoke('snippe-payment', {
          body: {
            order_id: order.id,
            buyer_email: formData.email,
            buyer_name: formData.name,
            buyer_phone: formData.phone,
            amount: total,
          },
        });

        if (error) {
          console.error('Payment edge function error:', error);
          setPaymentError('Unable to connect to payment service. Please try again.');
          setIsLoading(false);
          return;
        }

        if (data?.error) {
          const details = data.details;
          let userMessage = 'Payment failed. ';
          
          if (details?.error_code === 'AUTH_008') {
            userMessage += 'Payment service configuration error. Please contact support.';
          } else if (details?.error_code?.startsWith('AUTH_')) {
            userMessage += 'Payment service authentication issue. Please contact support.';
          } else if (details?.message) {
            userMessage += details.message;
          } else if (data.error) {
            userMessage += data.error;
          } else {
            userMessage += 'Please check your phone number and try again.';
          }

          setPaymentError(userMessage);
          setIsLoading(false);
          return;
        }

        if (data?.success) {
          setPaymentError(null);
          await supabase.from('cart_items').delete().eq('user_id', user?.id);
          toast.info("A payment request has been sent to your phone. Please enter your M-Pesa PIN to confirm.", { duration: 10000 });
          navigate(`/payment-success?order_id=${order.id}&method=mobile_money`);
        } else {
          setPaymentError('Payment could not be initiated. Please try again or use Cash on Delivery.');
          setIsLoading(false);
          return;
        }
      } else {
        // Cash on delivery
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', order.id);

        await supabase.from('cart_items').delete().eq('user_id', user?.id);
        toast.success("Order placed! Funds held in escrow until delivery.");
        navigate(`/payment-success?order_id=${order.id}`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setPaymentError(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingCart) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some products before checkout</p>
          <Button onClick={() => navigate('/products')}>Browse Products</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2">
            <ShoppingBag className="h-8 w-8" />
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Enter your details to complete the order</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+255 XXX XXX XXX"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Payment request will be sent to this number
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Delivery Address *
                      </Label>
                      <Textarea
                        id="address"
                        name="address"
                        placeholder="Street address, city, region..."
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        rows={3}
                      />
                    </div>

                    <Separator />

                    {/* Payment Method */}
                    <div className="space-y-4">
                      <Label>Payment Method</Label>
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                          <RadioGroupItem value="mobile_money" id="mobile_money" />
                          <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Mobile Money</p>
                              <p className="text-xs text-muted-foreground">M-Pesa, TigoPesa, Airtel</p>
                            </div>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                          <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                          <Label htmlFor="cash_on_delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">Cash on Delivery</p>
                              <p className="text-xs text-muted-foreground">Pay when delivered</p>
                            </div>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {paymentError && (
                      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium text-destructive">Payment Failed</p>
                            <p className="text-sm text-muted-foreground">{paymentError}</p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => handleSubmit()}
                          disabled={isLoading}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Retry Payment
                        </Button>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      className="w-full" 
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Place Order - TSh {total.toLocaleString()}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img 
                        src={item.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100'} 
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                        <p className="font-semibold text-primary">
                          TSh {(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">TSh {subtotal.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium">TSh {deliveryFee.toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">TSh {total.toLocaleString()}</span>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CreditCard className="h-4 w-4" />
                      <span>Secure payment via Snippe</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Supports M-Pesa, TigoPesa, and Airtel Money
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
