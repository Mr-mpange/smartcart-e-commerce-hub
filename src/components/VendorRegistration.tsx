import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Store, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function VendorRegistration() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      // First, add the vendor role to the user
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role: 'vendor' }]);

      if (roleError && !roleError.message.includes('duplicate')) {
        throw roleError;
      }

      // Then create the vendor profile
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .insert([{
          user_id: user.id,
          business_name: formData.businessName,
          business_description: formData.businessDescription,
        }]);

      if (profileError) throw profileError;

      toast.success('Vendor registration submitted! Awaiting approval.');
      setIsOpen(false);
      
      // Reload the page to refresh user role
      window.location.reload();
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      toast.error(error.message || 'Failed to register as vendor');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')}>
        <Store className="mr-2 h-4 w-4" />
        Become a Vendor
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Store className="mr-2 h-4 w-4" />
          Become a Vendor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Register as a Vendor
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              placeholder="Enter your business name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description</Label>
            <Textarea
              id="businessDescription"
              value={formData.businessDescription}
              onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
              placeholder="Tell us about your business..."
              rows={4}
            />
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                What you'll get
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personal vendor dashboard</li>
                <li>• Product management tools</li>
                <li>• Sales analytics & reporting</li>
                <li>• Direct customer communication</li>
              </ul>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Registration'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}