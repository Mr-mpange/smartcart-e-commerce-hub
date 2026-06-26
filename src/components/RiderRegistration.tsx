import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Truck, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function RiderRegistration() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, userRole } = useAuth();
  const [riderProfile, setRiderProfile] = useState<any>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    vehicleType: 'motorcycle',
    licenseNumber: '',
    areaOfOperation: '',
  });

  useEffect(() => {
    if (user && userRole === 'delivery_rider') {
      void fetchRiderProfile();
    }
  }, [user, userRole]);

  const fetchRiderProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rider_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setRiderProfile(data);
    } catch (error) {
      console.error('Rider profile fetch error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in first');
      navigate('/auth');
      return;
    }

    if (!formData.fullName || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (userRole && userRole !== 'customer' && userRole !== 'delivery_rider') {
      toast.error('Each account can only have one role. Use a separate account for driver access.');
      return;
    }

    if (userRole === 'customer') {
      toast.error('This account is already registered as customer. Ask admin to change the role or use another account.');
      return;
    }

    setLoading(true);
    try {
      const { error: profileError } = await supabase
        .from('rider_profiles')
        .insert([{
          user_id: user.id,
          full_name: formData.fullName,
          phone: formData.phone,
          vehicle_type: formData.vehicleType,
          license_number: formData.licenseNumber || null,
          area_of_operation: formData.areaOfOperation || null,
        }]);

      if (profileError) throw profileError;

      toast.success('Rider registration submitted! Awaiting admin approval.');
      setIsOpen(false);
      await fetchRiderProfile();
    } catch (error: any) {
      console.error('Rider registration error:', error);
      toast.error(error.message || 'Failed to register as rider');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button onClick={() => navigate('/auth')}>
        <Truck className="mr-2 h-4 w-4" />
        Become a Rider
      </Button>
    );
  }

  if (userRole === 'delivery_rider' && riderProfile) {
    return (
      <Button variant="outline" onClick={() => navigate('/rider/dashboard')}>
        <Truck className="mr-2 h-4 w-4" />
        Driver Dashboard
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Truck className="mr-2 h-4 w-4" />
          Become a Delivery Rider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Register as a Delivery Rider
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="riderName">Full Name *</Label>
            <Input
              id="riderName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riderPhone">Phone Number *</Label>
            <Input
              id="riderPhone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="e.g. 0712345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Vehicle Type</Label>
            <Select
              value={formData.vehicleType}
              onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motorcycle">Motorcycle</SelectItem>
                <SelectItem value="bicycle">Bicycle</SelectItem>
                <SelectItem value="car">Car</SelectItem>
                <SelectItem value="van">Van</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="license">License Number</Label>
            <Input
              id="license"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">Area of Operation</Label>
            <Input
              id="area"
              value={formData.areaOfOperation}
              onChange={(e) => setFormData({ ...formData, areaOfOperation: e.target.value })}
              placeholder="e.g. Dar es Salaam - Kinondoni"
            />
          </div>

          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                What you'll get
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Personal rider dashboard</li>
                <li>• Order assignment notifications</li>
                <li>• Google Maps navigation</li>
                <li>• Earnings tracking</li>
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
