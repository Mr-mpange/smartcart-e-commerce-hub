import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export function DatabaseCleanup() {
  const [loading, setLoading] = useState(false);
  const [dummyVendors, setDummyVendors] = useState<any[]>([]);

  const findDummyData = async () => {
    setLoading(true);
    try {
      // Look for vendors with dummy-like names or specific test data
      const { data: vendors, error } = await supabase
        .from('vendor_profiles')
        .select(`
          id,
          business_name,
          business_description,
          is_approved,
          created_at,
          user_id
        `)
        .or('business_name.ilike.%test%,business_name.ilike.%dummy%,business_name.ilike.%sample%,business_name.ilike.%tech gadgets%,business_name.eq.Tech Gadgets Store,business_name.ilike.%gadget%');

      if (error) throw error;

      setDummyVendors(vendors || []);
      toast.success(`Found ${vendors?.length || 0} potential dummy vendors`);
    } catch (error: any) {
      console.error('Error finding dummy data:', error);
      toast.error('Failed to search for dummy data');
    } finally {
      setLoading(false);
    }
  };

  const cleanupDummyVendor = async (vendorId: string, businessName: string) => {
    if (!confirm(`Delete vendor "${businessName}"? This cannot be undone.`)) return;

    try {
      // Get vendor profile to find user_id
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('user_id')
        .eq('id', vendorId)
        .single();

      if (!vendorProfile) throw new Error('Vendor not found');

      // Delete vendor profile
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .delete()
        .eq('id', vendorId);

      if (profileError) throw profileError;

      // Delete user roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', vendorProfile.user_id);

      // Delete user profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', vendorProfile.user_id);

      toast.success(`Deleted vendor: ${businessName}`);
      
      // Refresh the list
      findDummyData();
    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast.error(`Failed to delete ${businessName}`);
    }
  };

  const cleanupAllDummy = async () => {
    if (!confirm(`Delete ALL ${dummyVendors.length} dummy vendors? This cannot be undone.`)) return;

    setLoading(true);
    try {
      for (const vendor of dummyVendors) {
        await cleanupDummyVendor(vendor.id, vendor.business_name);
      }
      toast.success('All dummy vendors cleaned up!');
    } catch (error: any) {
      toast.error('Some vendors could not be deleted');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Database Cleanup Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This tool helps identify and remove dummy/test vendor data. Use with caution as deletions cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={findDummyData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Find Dummy Data
          </Button>
          {dummyVendors.length > 0 && (
            <Button variant="destructive" onClick={cleanupAllDummy} disabled={loading}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All ({dummyVendors.length})
            </Button>
          )}
        </div>

        {dummyVendors.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Found Potential Dummy Vendors:</h3>
            {dummyVendors.map((vendor) => (
              <div key={vendor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{vendor.business_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {vendor.business_description || 'No description'} • 
                    Created: {new Date(vendor.created_at).toLocaleDateString()} • 
                    Status: {vendor.is_approved ? 'Approved' : 'Pending'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => cleanupDummyVendor(vendor.id, vendor.business_name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {dummyVendors.length === 0 && !loading && (
          <p className="text-muted-foreground text-center py-4">
            No dummy vendors found. Click "Find Dummy Data" to search.
          </p>
        )}
      </CardContent>
    </Card>
  );
}