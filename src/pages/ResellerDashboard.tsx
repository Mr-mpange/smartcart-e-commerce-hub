import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ResellerSidebar } from '@/components/ResellerSidebar';
import { ResellerProductManagement } from '@/components/ResellerProductManagement';
import { PaymentMonitoring } from '@/components/PaymentMonitoring';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ShoppingCart, DollarSign, TrendingUp, Users, Package, AlertTriangle, Plus, Loader2 } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState("overview");
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<any>(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const tabTitles: Record<string, string> = {
    overview: 'Overview',
    products: 'My Products',
    sales: 'Sales History',
    commissions: 'Commissions',
    payments: 'Payment Collection',
    wallet: 'Wallet',
    notifications: 'Notifications',
    settings: 'Settings',
  };

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
        fetchWallet();
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
    
    // Use mock data since reseller tables don't exist yet
    setResellerProfile({
      business_name: 'My Reseller Business',
      is_approved: false,
      commission_rate: 10,
      total_sales: 0,
      total_commission: 0,
      migration_pending: true
    });
  };

  const fetchWallet = async () => {
    if (!user) return;
    try {
      setWalletLoading(true);
      let { data: walletData } = await supabase
        .from("wallets")
        .select("id, balance, currency")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!walletData) {
        const { data: newWallet } = await supabase
          .from("wallets")
          .insert({ user_id: user.id })
          .select("id, balance, currency")
          .single();
        walletData = newWallet;
      }
      setWallet(walletData);
    } catch (err: any) {
      console.error("Wallet error:", err);
      toast.error("Failed to load wallet");
    } finally {
      setWalletLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || !wallet) {
      toast.error("Enter a valid amount");
      return;
    }
    setTopUpLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to top up wallet');
        return;
      }

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/create-topup-link`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          frontend_url: window.location.origin
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to create top-up link');
      }

      if (data.success) {
        toast.success('Redirecting to payment...');
        window.location.href = data.checkout_url || data.payment_link;
      } else {
        throw new Error(data.message || 'Failed to create top-up link');
      }
    } catch (err: any) {
      console.error('Top-up error:', err);
      toast.error(err.message || 'Top-up failed');
    } finally {
      setTopUpLoading(false);
    }
  };
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Price Control Notice - REMOVED: Now using dynamic pricing rules */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">TSh {stats.totalSales.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Products sold</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
                  <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">TSh {stats.totalCommission.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">{stats.commissionRate}% commission rate</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Commission Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats.commissionRate}%</div>
                  <p className="text-xs text-muted-foreground">Per sale commission</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Customers</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.totalCustomers}</div>
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
                    <h4 className="font-medium">1. Add Products</h4>
                    <p className="text-sm text-muted-foreground">
                      Browse our product catalog and add products to your reseller catalog. You cannot exceed vendor prices.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">2. Set Your Prices</h4>
                    <p className="text-sm text-muted-foreground">
                      Set your selling prices within the allowed markup limit. Higher prices = higher commissions.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">3. Share & Sell</h4>
                    <p className="text-sm text-muted-foreground">
                      Share products with your customers using your unique referral links and earn commissions.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">4. Track & Earn</h4>
                    <p className="text-sm text-muted-foreground">
                      Monitor your sales, commissions, and withdraw earnings directly to your mobile money account.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'products':
        return <ResellerProductManagement resellerId={user?.id} />;

      case 'sales':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Sales History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No sales yet</p>
            </CardContent>
          </Card>
        );

      case 'commissions':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Commission Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">TSh {stats.totalCommission.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">TSh 0</div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">TSh 0</div>
                    <p className="text-sm text-muted-foreground">Withdrawn</p>
                  </div>
                </div>
                <p className="text-muted-foreground text-center py-4">No commission history yet</p>
              </div>
            </CardContent>
          </Card>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Collection & Wallet</h2>
            
            {/* Commission Wallet */}
            <Card>
              <CardHeader>
                <CardTitle>Commission Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">TSh {stats.totalCommission.toLocaleString()}</div>
                <p className="text-muted-foreground">Available commission balance</p>
              </CardContent>
            </Card>

            {/* Payment Collection */}
            <PaymentMonitoring />
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">My Wallet</h2>
            
            {walletLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : wallet ? (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Available Balance</h3>
                    <CardTitle className="text-4xl text-primary">
                      TSh {(wallet?.balance || 0).toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex gap-2 flex-wrap">
                    <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Top Up
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Top Up Wallet</DialogTitle>
                          <DialogDescription>Enter the amount to add to your wallet</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            type="number"
                            placeholder="Amount in TSh"
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                          />
                          <div className="flex gap-2">
                            {[5000, 10000, 50000, 100000].map((amt) => (
                              <Button key={amt} variant="outline" size="sm" onClick={() => setTopUpAmount(String(amt))}>
                                {amt.toLocaleString()}
                              </Button>
                            ))}
                          </div>
                          <Button className="w-full" onClick={handleTopUp} disabled={topUpLoading}>
                            {topUpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Add TSh {parseFloat(topUpAmount || "0").toLocaleString()}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        );

      case 'notifications':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">No notifications yet</p>
            </CardContent>
          </Card>
        );

      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">Settings panel coming soon</p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SidebarProvider>
        <div className="flex-1 flex w-full">
          <ResellerSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center justify-between border-b px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold">{tabTitles[activeTab] || 'Reseller Dashboard'}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user?.email?.split('@')[0] || 'Reseller'}
                </span>
              </div>
            </header>
            <div className="flex-1 p-4 md:p-8 overflow-auto">
              {renderTabContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
