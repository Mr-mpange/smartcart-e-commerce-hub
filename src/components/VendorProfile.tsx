import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { User, Mail, Calendar, Store, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface VendorProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  created_at: string;
  business_name: string;
  business_description: string | null;
  is_approved: boolean;
  documents_verified: boolean;
}

export function VendorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<VendorProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    business_name: '',
    business_description: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      // Get user profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Get vendor profile
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (vendorError) throw vendorError;
      
      const profileData = {
        id: user.id,
        email: user.email || '',
        full_name: userProfile?.full_name || '',
        phone: userProfile?.phone || null,
        created_at: user.created_at || '',
        business_name: vendorProfile?.business_name || '',
        business_description: vendorProfile?.business_description || null,
        is_approved: vendorProfile?.is_approved || false,
        documents_verified: vendorProfile?.documents_verified || false,
      };

      setProfile(profileData);
      setFormData({
        full_name: profileData.full_name,
        phone: profileData.phone || '',
        business_name: profileData.business_name,
        business_description: profileData.business_description || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update vendor profile
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .update({
          business_name: formData.business_name,
          business_description: formData.business_description || null,
        })
        .eq('user_id', user.id);

      if (vendorError) throw vendorError;
      
      toast.success('Profile updated successfully');
      fetchProfile();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src="" />
          <AvatarFallback className="text-lg">
            {getInitials(profile.full_name || profile.business_name || 'Vendor')}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{profile.business_name}</h1>
          <p className="text-muted-foreground">{profile.full_name}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={profile.is_approved ? "default" : "secondary"} className="gap-1">
              {profile.is_approved ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {profile.is_approved ? 'Approved' : 'Pending Approval'}
            </Badge>
            {profile.documents_verified && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle className="h-3 w-3" />
                Documents Verified
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter your phone number"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="Enter your business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_description">Business Description</Label>
              <Textarea
                id="business_description"
                value={formData.business_description}
                onChange={(e) => setFormData({ ...formData, business_description: e.target.value })}
                placeholder="Describe your business..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={profile.email} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed from this interface
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Vendor Approval</span>
                <Badge variant={profile.is_approved ? "default" : "secondary"}>
                  {profile.is_approved ? 'Approved' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Documents Verified</span>
                <Badge variant={profile.documents_verified ? "default" : "secondary"}>
                  {profile.documents_verified ? 'Verified' : 'Pending'}
                </Badge>
              </div>
            </div>
            {!profile.is_approved && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Your vendor account is pending approval. You can update your information, but you won't be able to add products until approved.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}