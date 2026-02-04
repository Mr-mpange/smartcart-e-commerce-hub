import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Package, DollarSign, ShoppingCart, TrendingUp, Plus, Edit, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { VendorOrderManagement } from '@/components/VendorOrderManagement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  stock_quantity: number;
  is_active: boolean;
}

interface OrderItem {
  id: string;
  created_at: string;
  quantity: number;
  price: number;
  product_id: string | null;
}

export default function VendorDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalSales: 0, revenue: 0, orders: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    image_url: '',
    stock_quantity: '10',
  });

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
      fetchProducts();
      fetchStats();
    }
  }, [user, userRole, authLoading, navigate]);

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
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;
    
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', user.id);

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('quantity, price')
        .eq('vendor_id', user.id);

      const totalProducts = productsData?.length || 0;
      const totalSales = orderItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const revenue = orderItems?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

      setStats({
        totalProducts,
        totalSales,
        revenue,
        orders: orderItems?.length || 0,
      });
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        category: formData.category,
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        stock_quantity: parseInt(formData.stock_quantity),
        vendor_id: user.id,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData]);

        if (error) throw error;
        toast.success('Product added successfully');
      }

      setIsDialogOpen(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
      fetchStats();
    } catch (error: any) {
      console.error('Product save error:', error);
      toast.error(error.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      category: product.category,
      image_url: product.image_url || '',
      stock_quantity: product.stock_quantity.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Product deleted successfully');
      fetchProducts();
      fetchStats();
    } catch (error: any) {
      toast.error('Failed to delete product');
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      toast.success(product.is_active ? 'Product hidden' : 'Product visible');
      fetchProducts();
    } catch (error: any) {
      toast.error('Failed to update product status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'Electronics',
      image_url: '',
      stock_quantity: '10',
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold">Vendor Dashboard</h1>
            <p className="text-muted-foreground">Manage your products and track sales</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingProduct(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Product Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter product name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Home">Home & Garden</SelectItem>
                        <SelectItem value="Sports">Sports & Outdoors</SelectItem>
                        <SelectItem value="Books">Books</SelectItem>
                        <SelectItem value="Beauty">Beauty & Health</SelectItem>
                        <SelectItem value="Toys">Toys & Games</SelectItem>
                        <SelectItem value="Automotive">Automotive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your product..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (TSh) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="100"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 50000"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock Quantity *</Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to use a default image</p>
                </div>
                <Button type="submit" className="w-full bg-gradient-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Listed products</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Units sold</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">TSh {stats.revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total earnings</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.orders}</div>
              <p className="text-xs text-muted-foreground">Order items</p>
            </CardContent>
          </Card>
        </div>

        {/* Products Section */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Recent Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                    <p className="text-muted-foreground mb-4">Start by adding your first product</p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Product
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className={`overflow-hidden ${!product.is_active ? 'opacity-60' : ''}`}>
                        <div className="relative">
                          <img
                            src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
                            alt={product.name}
                            className="w-full h-48 object-cover"
                          />
                          {!product.is_active && (
                            <Badge className="absolute top-2 left-2" variant="secondary">Hidden</Badge>
                          )}
                          {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                            <Badge className="absolute top-2 right-2 bg-yellow-500">Low Stock</Badge>
                          )}
                          {product.stock_quantity === 0 && (
                            <Badge className="absolute top-2 right-2" variant="destructive">Out of Stock</Badge>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                            {product.description || 'No description'}
                          </p>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-xl font-bold text-primary">
                              TSh {product.price.toLocaleString()}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              Stock: {product.stock_quantity}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleProductStatus(product)}
                            >
                              {product.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
              </CardHeader>
              <CardContent>
                <VendorOrderManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}