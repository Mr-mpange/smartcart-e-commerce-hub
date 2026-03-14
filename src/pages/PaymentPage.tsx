import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Phone, CheckCircle, AlertCircle, ExternalLink, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode.react';

export default function PaymentPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qrRef = useRef<HTMLDivElement>(null);
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPaymentLink();
    } else {
      setError('Invalid payment link');
      setLoading(false);
    }
  }, [slug]);

  const fetchPaymentLink = async () => {
    try {
      console.log('Fetching payment link with slug:', slug);
      
      // Direct REST API call - no Supabase client needed
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !anonKey) {
        throw new Error('Supabase configuration missing');
      }
      
      // Try to fetch by slug first
      let url = `${supabaseUrl}/rest/v1/payment_links?slug=eq.${slug}&select=*`;
      console.log('Fetching from:', url);
      
      let response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('HTTP error:', response.status);
        throw new Error(`HTTP ${response.status}`);
      }

      let data = await response.json();
      console.log('Response data:', data);

      // If no results by slug, try by ID (for backward compatibility)
      if (!Array.isArray(data) || data.length === 0) {
        console.log('No payment link found by slug, trying by ID...');
        url = `${supabaseUrl}/rest/v1/payment_links?id=eq.${slug}&select=*`;
        console.log('Fetching from:', url);
        
        response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': anonKey,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          console.error('HTTP error:', response.status);
          throw new Error(`HTTP ${response.status}`);
        }

        data = await response.json();
        console.log('Response data by ID:', data);
      }

      if (!Array.isArray(data) || data.length === 0) {
        console.error('No payment link found in database');
        setError('Payment link not found. Please check the link and try again.');
        setLoading(false);
        return;
      }

      const paymentData = data[0];
      console.log('Payment link loaded:', paymentData);
      
      // Track view
      await trackView(paymentData.id, paymentData.views || 0);
      
      setPaymentLink(paymentData);
      setLoading(false);
      
      console.log('Payment link ready for checkout');
      console.log('Snippe reference:', paymentData.snippe_reference);
    } catch (err: any) {
      console.error('Error fetching payment link:', err);
      setError(err.message || 'Failed to load payment link. Please check the link.');
      setLoading(false);
    }
  };

  const trackView = async (linkId: string, currentViews: number = 0) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      // Increment view count
      await fetch(`${supabaseUrl}/rest/v1/payment_links?id=eq.${linkId}`, {
        method: 'PATCH',
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          views: currentViews + 1
        })
      });
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error || !paymentLink) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Payment Link Not Found</h2>
              <p className="text-muted-foreground text-sm">
                {error || 'This payment link may have expired or been removed.'}
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => navigate('/')}
              >
                Go Home
              </Button>
              <Button 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date();
  const isPaid = paymentLink.status === 'paid';
  const paymentUrl = `https://uzanasi.online/pay/${slug}`;

  const handleProceedToPayment = () => {
    if (!phoneNumber || !phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setProcessingPayment(true);
    
    // Format phone number
    let phone = phoneNumber.trim().replace(/[^0-9]/g, '');
    if (phone.startsWith('0')) {
      phone = '255' + phone.substring(1);
    }
    if (!phone.startsWith('255')) {
      phone = '255' + phone;
    }

    console.log('Initiating payment with phone:', phone);
    
    // Show message
    toast.info(`Sending payment request to ${phone}...`, { duration: 5000 });
    
    // Redirect to Snippe with phone number
    if (paymentLink.checkout_url) {
      window.location.href = `${paymentLink.checkout_url}?phone=${phone}`;
    } else if (paymentLink.snippe_reference) {
      window.location.href = `https://snippe.me/checkout/${paymentLink.snippe_reference}?phone=${phone}`;
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL();
      link.download = `payment-${slug}.png`;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CreditCard className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Payment Request</CardTitle>
            <Badge variant={isPaid ? "default" : isExpired ? "destructive" : "secondary"} className="mt-2 mx-auto">
              {isPaid ? "✓ Paid" : isExpired ? "Expired" : "Active"}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Amount */}
            <div className="text-center space-y-2 py-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Amount to Pay</p>
              <div className="text-5xl font-bold text-primary">
                TSh {paymentLink.amount.toLocaleString()}
              </div>
              {paymentLink.description && (
                <p className="text-muted-foreground text-sm pt-2">{paymentLink.description}</p>
              )}
            </div>

            {/* QR Code Section */}
            <div className="border rounded-lg p-6 bg-muted/30 text-center space-y-4">
              <h3 className="font-semibold text-sm">Scan to Pay</h3>
              <div ref={qrRef} className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode 
                    value={paymentUrl} 
                    size={200} 
                    level="H" 
                    includeMargin={true}
                  />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadQR}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>

            {/* Recipient Info */}
            {(paymentLink.recipient_name || paymentLink.recipient_phone) && (
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-sm">Payment To:</h3>
                {paymentLink.recipient_name && (
                  <p className="text-sm font-medium">{paymentLink.recipient_name}</p>
                )}
                {paymentLink.recipient_phone && (
                  <p className="text-sm flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {paymentLink.recipient_phone}
                  </p>
                )}
              </div>
            )}

            {/* Reference */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="font-semibold text-sm mb-2">Reference Number</h3>
              <p className="font-mono text-sm break-all">{paymentLink.snippe_reference || paymentLink.slug}</p>
            </div>

            {/* Share Link - MAIN FOCUS */}
            <div className="border-2 border-primary rounded-lg p-6 bg-primary/5 space-y-4">
              <h3 className="font-bold text-lg">📤 Share This Payment Link</h3>
              <p className="text-sm text-muted-foreground">
                Copy and share this link with customers. They can pay directly from this link!
              </p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={paymentUrl}
                  readOnly
                  className="flex-1 px-4 py-3 border rounded-lg text-sm bg-white font-mono"
                />
                <Button 
                  variant="default"
                  size="lg"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const text = `Pay here: ${paymentUrl}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Copied to clipboard!');
                  }}
                >
                  📱 Copy for SMS
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const text = `Pay here: ${paymentUrl}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  💬 Share on WhatsApp
                </Button>
              </div>
            </div>

            {/* Payment Status */}
            {isPaid ? (
              <div className="text-center py-6 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold text-green-700 dark:text-green-400">Payment Completed</h3>
                <p className="text-green-600 dark:text-green-300 text-sm mt-2">This payment has been successfully processed.</p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                <AlertCircle className="h-16 w-16 mx-auto text-red-600 mb-4" />
                <h3 className="text-xl font-semibold text-red-700 dark:text-red-400">Payment Expired</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mt-2">This payment link has expired and can no longer be used.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Ready to Pay?</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter your phone number and click proceed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Phone Number *</label>
                  <input 
                    type="tel" 
                    placeholder="e.g., 255754123456 or 0754123456"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: 255XXXXXXXXX or 0XXXXXXXXX
                  </p>
                </div>
                
                <Button 
                  onClick={handleProceedToPayment}
                  size="lg"
                  className="w-full gap-2"
                  disabled={processingPayment || !phoneNumber.trim()}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <h4 className="font-medium text-sm mb-1">M-Pesa</h4>
                      <p className="text-xs text-muted-foreground">
                        Send money using M-Pesa
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <h4 className="font-medium text-sm mb-1">Tigo Pesa</h4>
                      <p className="text-xs text-muted-foreground">
                        Send money using Tigo Pesa
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p>🔒 This is a secure payment link. Your payment will be processed safely.</p>
                </div>
              </div>
            )}

            {/* Analytics */}
            <div className="border-t pt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Views</p>
                <p className="text-lg font-semibold">{paymentLink.views || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payments</p>
                <p className="text-lg font-semibold">{paymentLink.payments_count || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-lg font-semibold">TSh {(paymentLink.total_collected || 0).toLocaleString()}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4 space-y-1">
              <p>Created on {new Date(paymentLink.created_at).toLocaleDateString()}</p>
              {paymentLink.expires_at && (
                <p>Expires on {new Date(paymentLink.expires_at).toLocaleDateString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
