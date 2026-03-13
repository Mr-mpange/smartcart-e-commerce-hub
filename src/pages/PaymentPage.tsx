import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PaymentPage() {
  const { linkId } = useParams();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (linkId) {
      fetchPaymentLink();
    }
  }, [linkId]);

  const fetchPaymentLink = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_links')
        .select('*')
        .eq('id', linkId)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Payment link not found');
        return;
      }

      setPaymentLink(data);
    } catch (err: any) {
      console.error('Error fetching payment link:', err);
      setError('Failed to load payment link');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Payment Link Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'This payment link may have expired or been removed.'}
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = paymentLink.expires_at && new Date(paymentLink.expires_at) < new Date();
  const isPaid = paymentLink.status === 'paid';

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
            <Badge variant={isPaid ? "default" : isExpired ? "destructive" : "secondary"}>
              {isPaid ? "Paid" : isExpired ? "Expired" : "Active"}
            </Badge>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Details */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-primary">
                TSh {paymentLink.amount.toLocaleString()}
              </div>
              {paymentLink.description && (
                <p className="text-muted-foreground">{paymentLink.description}</p>
              )}
            </div>

            {/* Recipient Info */}
            {(paymentLink.recipient_name || paymentLink.recipient_phone) && (
              <div className="border rounded-lg p-4 space-y-2">
                <h3 className="font-medium">Payment To:</h3>
                {paymentLink.recipient_name && (
                  <p className="text-sm">{paymentLink.recipient_name}</p>
                )}
                {paymentLink.recipient_phone && (
                  <p className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {paymentLink.recipient_phone}
                  </p>
                )}
              </div>
            )}

            {/* Reference */}
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Reference</h3>
              <p className="font-mono text-sm">{paymentLink.snippe_reference || ref || paymentLink.id.slice(0, 8)}</p>
            </div>

            {/* Payment Status */}
            {isPaid ? (
              <div className="text-center py-4">
                <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                <h3 className="text-xl font-semibold text-green-600">Payment Completed</h3>
                <p className="text-muted-foreground">This payment has been successfully processed.</p>
              </div>
            ) : isExpired ? (
              <div className="text-center py-4">
                <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
                <h3 className="text-xl font-semibold text-destructive">Payment Expired</h3>
                <p className="text-muted-foreground">This payment link has expired and can no longer be used.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">How to Pay</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use your mobile money service to send TSh {paymentLink.amount.toLocaleString()} to complete this payment.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <h4 className="font-medium mb-2">M-Pesa</h4>
                      <p className="text-sm text-muted-foreground">
                        Send money using M-Pesa to complete your payment
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <h4 className="font-medium mb-2">Tigo Pesa</h4>
                      <p className="text-sm text-muted-foreground">
                        Send money using Tigo Pesa to complete your payment
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <p>This is a secure payment link. Your payment will be processed safely.</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground border-t pt-4">
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