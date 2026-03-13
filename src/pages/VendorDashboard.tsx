import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { VendorSidebar } from '@/components/VendorSidebar';
import { VendorProfile } from '@/components/VendorProfile';
import { VendorOrderManagement } from '@/components/VendorOrderManagement';
import { VendorDocumentUpload } from '@/components/VendorDocumentUpload';
import { ProductImageUpload } from '@/components/ProductImageUpload';
import { PaymentMonitoring } from '@/components/PaymentMonitoring';
import { Package, DollarSign, ShoppingCart, TrendingUp, AlertCircle, Plus, Edit, Trash2, Eye, BarChart3, Wallet, Bell, Settings, Upload, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [vendorProfile, setVendorProfile] = useState<{ 
    business_name: string; 
    is_approved: boolean;
  } | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalOrders: 0
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock_quantity: '',
    image_url: ''
  });
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
        return;
      }
      
      if (userRole && userRole !== 'vendor' && userRole !== 'admin') {
        toast.error('You need to be a vendor to access this page');
        navigate('/vendors');
        return;
      }
      
      if (user && (userRole === 'vendor' || userRole === 'admin')) {
        fetchVendorProfile();
        fetchVendorStats();
        fetchProducts();
        fetchAnalyticsData();
      }
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!authLoading && user && !userRole) {
        toast.error('Unable to determine user permissions. Please try logging in again.');
        navigate('/auth');
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [authLoading, user, userRole, navigate]);

  const fetchVendorProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('business_name, is_approved')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setVendorProfile(data);
    } catch (error) {
      // Error fetching vendor profile - using fallback
    }
  };

  const fetchVendorStats = async () => {
    if (!user) return;
    
    try {
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

      // Fix the order_items query - use proper join syntax
      const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
          quantity,
          price,
          orders!inner(
            vendor_id,
            status
          )
        `)
        .eq('orders.vendor_id', user.id);

      const totalSales = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const totalRevenue = orderItems?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
      const totalOrders = orderItems?.length || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalSales,
        totalRevenue,
        totalOrders
      });
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      // Use fallback stats if query fails
      setStats({
        totalProducts: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalOrders: 0
      });
    }
  };

  const fetchProducts = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      
      // Generate category data for pie chart
      const categories = (data || []).reduce((acc: any, product: any) => {
        const cat = product.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      
      const categoryChartData = Object.entries(categories).map(([name, value]) => ({
        name,
        value,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));
      
      setCategoryData(categoryChartData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchAnalyticsData = async () => {
    // Generate mock analytics data for the last 7 days
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: Math.floor(Math.random() * 50) + 10,
        revenue: Math.floor(Math.random() * 50000) + 10000,
        orders: Math.floor(Math.random() * 20) + 5
      });
    }
    setAnalyticsData(data);
  };
  const handleCreateProduct = async () => {
    if (!user || !vendorProfile?.is_approved) {
      toast.error('Your account must be approved to add products');
      return;
    }

    if (!newProduct.name || !newProduct.price) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          ...newProduct,
          vendor_id: user.id,
          price: parseFloat(newProduct.price),
          stock_quantity: parseInt(newProduct.stock_quantity) || 0
        }]);

      if (error) throw error;
      
      toast.success('Product created successfully!');
      setShowProductDialog(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        category: '',
        stock_quantity: '',
        image_url: ''
      });
      fetchProducts();
      fetchVendorStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name,
          description: editingProduct.description,
          price: parseFloat(editingProduct.price),
          category: editingProduct.category,
          stock_quantity: parseInt(editingProduct.stock_quantity) || 0,
          image_url: editingProduct.image_url
        })
        .eq('id', editingProduct.id);

      if (error) throw error;
      
      toast.success('Product updated successfully!');
      setEditingProduct(null);
      fetchProducts();
      fetchVendorStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      
      toast.success('Product deleted successfully!');
      fetchProducts();
      fetchVendorStats();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, image_url: imageUrl });
    } else {
      setNewProduct({ ...newProduct, image_url: imageUrl });
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {authLoading ? 'Loading authentication...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    );
  }

  if (user && !userRole && !authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading user permissions...</p>
          <p className="text-xs text-muted-foreground mt-2">This should only take a moment...</p>
        </div>
      </div>
    );
  }
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {vendorProfile && !vendorProfile.is_approved && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold text-yellow-800">Account Pending Approval</h3>
                      <p className="text-sm text-yellow-700">
                        Your vendor account is awaiting admin approval. You'll be able to add and manage products once approved.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">Listed products</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats.totalSales}</div>
                  <p className="text-xs text-muted-foreground">Units sold</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-5 w-5 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">TSh {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Total earnings</p>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-600">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">Order items</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setShowProductDialog(true)} 
                    disabled={!vendorProfile?.is_approved}
                    className="h-20 flex-col gap-2"
                  >
                    <Plus className="h-6 w-6" />
                    Add Product
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('orders')} className="h-20 flex-col gap-2">
                    <ShoppingCart className="h-6 w-6" />
                    View Orders
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('payments')} className="h-20 flex-col gap-2">
                    <DollarSign className="h-6 w-6" />
                    Payment Links
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('analytics')} className="h-20 flex-col gap-2">
                    <BarChart3 className="h-6 w-6" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Products</h2>
              <Button disabled={!vendorProfile?.is_approved} onClick={() => setShowProductDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {!vendorProfile?.is_approved && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                  <p className="text-yellow-800">Your account must be approved before you can add products.</p>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg text-muted-foreground mb-2">No products yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Add your first product to get started!</p>
                    {vendorProfile?.is_approved && (
                      <Button onClick={() => setShowProductDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    )}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description || "No description"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">TSh {product.price.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"}>
                              {product.stock_quantity} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={product.stock_quantity > 0 ? "default" : "secondary"}>
                              {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id, product.name)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        );
      case 'orders':
        return <VendorOrderManagement />;

      case 'analytics':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [
                      name === 'revenue' ? `TSh ${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Sales'
                    ]} />
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sales" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Category Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Products by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats.totalRevenue > 0 ? (stats.totalRevenue / stats.totalSales).toFixed(0) : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {((stats.totalSales / stats.totalProducts) * 100 || 0).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Sell-through Rate</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {products.filter(p => p.stock_quantity > 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">In Stock Items</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {products.filter(p => p.stock_quantity === 0).length}
                    </div>
                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Documents</h2>
            <VendorDocumentUpload vendorId={user?.id} />
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Payment Collection</h2>
            <PaymentMonitoring />
          </div>
        );

      case 'wallet':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Wallet & Payments</h2>
            
            {/* Payment Collection */}
            <PaymentMonitoring />
            
            {/* Wallet Balance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="text-green-600">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">TSh {stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-muted-foreground">Ready for withdrawal</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="text-blue-600">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">TSh 0</div>
                  <p className="text-muted-foreground">Processing payments</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="text-purple-600">Total Withdrawn</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">TSh 0</div>
                  <p className="text-muted-foreground">Lifetime withdrawals</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Notifications</h2>
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Order Notifications</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Payment Notifications</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Low Stock Alerts</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <span>Marketing Updates</span>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Settings</h2>
            <Card>
              <CardHeader>
                <CardTitle>Store Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Store Status</Label>
                  <div className="flex items-center space-x-2">
                    <Switch defaultChecked />
                    <span className="text-sm">Store is active and accepting orders</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Auto-approve Orders</Label>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <span className="text-sm">Automatically approve new orders</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      
      case 'profile':
        return <VendorProfile />;
      
      default:
        return null;
    }
  };
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <VendorSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center gap-4 px-4">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-lg font-semibold">
                  {vendorProfile?.business_name || 'Vendor Dashboard'}
                </h1>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6">
            {renderTabContent()}
          </div>
        </main>
      </div>

      {/* Product Creation Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product for your store. Fill in the required information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Enter product name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (TSh) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newProduct.category} onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="beauty">Beauty & Health</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock_quantity}
                  onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Product Image</Label>
              <ProductImageUpload onImageUpload={handleImageUpload} />
              {newProduct.image_url && (
                <div className="mt-2">
                  <img src={newProduct.image_url} alt="Product preview" className="w-32 h-32 object-cover rounded border" />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateProduct} disabled={loading}>
              {loading ? 'Creating...' : 'Create Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Edit Dialog */}
      {editingProduct && (
        <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Update your product information below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (TSh) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingProduct.category} onValueChange={(v) => setEditingProduct({ ...editingProduct, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="home">Home & Garden</SelectItem>
                      <SelectItem value="books">Books</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="beauty">Beauty & Health</SelectItem>
                      <SelectItem value="food">Food & Beverages</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Quantity</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock_quantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <ProductImageUpload onImageUpload={handleImageUpload} />
                {editingProduct.image_url && (
                  <div className="mt-2">
                    <img src={editingProduct.image_url} alt="Product preview" className="w-32 h-32 object-cover rounded border" />
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancel</Button>
              <Button onClick={handleUpdateProduct} disabled={loading}>
                {loading ? 'Updating...' : 'Update Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </SidebarProvider>
  );
}