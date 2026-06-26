import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Store, CheckCircle, FileText } from 'lucide-react';
import { VendorDocumentUpload } from '@/components/VendorDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function VendorRegistration() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    businessDescription: '',
  });

  useEffect(() => {
    if (user && userRole === 'vendor') {
      fetchVendorProfile();
    }
  }, [user, userRole]);

  const fetchVendorProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setVendorProfile(data);
    } catch (error: any) {
      console.error('Error fetching vendor profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    if (userRole && userRole !== 'customer' && userRole !== 'vendor') {
      toast.error('Each account can only have one role. Use a separate account for vendor access.');
      return;
    }

    if (userRole === 'customer') {
      toast.error('This account is already registered as customer. Ask admin to change the role or use another account.');
      return;
    }

    setLoading(true);

    try {
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .insert([{
          user_id: user.id,
          business_name: formData.businessName,
          business_description: formData.businessDescription,
        }]);

      if (profileError) throw profileError;

      toast.success('Vendor registration submitted! Please upload verification documents.');
      setIsOpen(false);
      fetchVendorProfile();
      
      // Don't reload the page, just refresh the vendor profile
    } catch (error: any) {
      console.error('Vendor registration error:', error);
      toast.error(error.message || 'Failed to register as vendor');
    } finally {
      setLoading(false);
    }
  };

  // If user is already a vendor, show document upload
  if (userRole === 'vendor' && vendorProfile) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Vendor Documents
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Vendor Profile & Documents
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="font-medium">Business Name</Label>
                    <p>{vendorProfile.business_name}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Status</Label>
                    <div className="flex items-center gap-2">
                      {vendorProfile.is_approved ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          Approved
                        </span>
                      ) : (
                        <span className="text-yellow-600">Pending Approval</span>
                      )}
                    </div>
                  </div>
                  {vendorProfile.business_description && (
                    <div className="col-span-2">
                      <Label className="font-medium">Description</Label>
                      <p>{vendorProfile.business_description}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <VendorDocumentUpload vendorId={vendorProfile.id} />
          </div>
        </DialogContent>
      </Dialog>
    );
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
