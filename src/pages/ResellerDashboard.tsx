import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShoppingCart, DollarSign, TrendingUp, Users, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function ResellerDashboard() {
  const [resellerProfile, setResellerProfile] = useState<any>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    commissionRate: 10,
    totalCustomers: 0
  });
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (userRole && userRole !== 'reseller' && userRole !== 'admin') {
        toast.error('You need to be a reseller to access this page');
        navigate('/');
        return;
      }
      
      if (user && (userRole === 'reseller' || userRole === 'admin')) {
        fetchResellerProfile();
      }
    }
  }, [user, userRole, authLoading, navigate]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authLoading && user && !userRole) {
        toast.error('Unable to determine user permissions. Please try logging in again.');
        navigate('/auth');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authLoading, user, userRole, navigate]);

  const fetchResellerProfile = async () => {
    if (!user) return;
    
    // Mock data until reseller system is fully set up
    setResellerProfile({
      business_name: 'My Reseller Business',
      is_approved: false,
      commission_rate: 10,
      total_sales: 0,
      total_commission: 0
    });
    
    setStats(prev => ({
      ...prev,
      totalSales: 0,
      totalCommission: 0,
      commissionRate: 10
    }));
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Reseller Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                {resellerProfile?.business_name || 'Winga Reseller'}
              </p>
            </div>
          </div>

          {resellerProfile && !resellerProfile.is_approved && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="font-semibold text-yellow-800">Reseller System Setup</h3>
                    <p className="text-sm text-yellow-700">
                      The reseller system is being configured. Please apply the database migrations to enable full functionality.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <ShoppingCart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">TSh {stats.totalSales.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Products sold</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">TSh {stats.totalCommission.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">{stats.commissionRate}% commission rate</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.commissionRate}%</div>
                <p className="text-xs text-muted-foreground">Per sale commission</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">Referred customers</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started as a Reseller</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">1. Share Products</h4>
                  <p className="text-sm text-muted-foreground">
                    Browse our product catalog and share products with your customers using your unique referral links.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">2. Earn Commissions</h4>
                  <p className="text-sm text-muted-foreground">
                    Earn {stats.commissionRate}% commission on every sale made through your referral links.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">3. Track Performance</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor your sales, commissions, and customer referrals through this dashboard.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">4. Get Paid</h4>
                  <p className="text-sm text-muted-foreground">
                    Withdraw your earned commissions directly to your mobile money account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No recent activity yet</p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}