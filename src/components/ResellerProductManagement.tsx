import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { validateResellerPrice, formatPriceValidationMessage } from '@/lib/reseller-pricing';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  vendor_id: string;
  image_url?: string;
}

interface ResellerProduct {
  id: string;
  product_id: string;
  reseller_price: number;
  original_price: number;
  markup_percentage: number;
  is_active: boolean;
  product?: Product;
}

interface ResellerProductManagementProps {
  resellerId?: string;
}

export function ResellerProductManagement({ resellerId }: ResellerProductManagementProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [resellerProducts, setResellerProducts] = useState<ResellerProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [resellerPrice, setResellerPrice] = useState('');
  const [maxMarkup, setMaxMarkup] = useState(0);
  const [editingProduct, setEditingProduct] = useState<ResellerProduct | null>(null);

  useEffect(() => {
    if (user) {
      fetchProducts();
      fetchResellerProducts();
      fetchResellerProfile();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchResellerProducts = async () => {
    if (!user) return;
    
    try {
      // Mock data for now since table doesn't exist yet
      setResellerProducts([]);
    } catch (error) {
      console.error('Error fetching reseller products:', error);
    }
  };

  const fetchResellerProfile = async () => {
    if (!user) return;
    
    try {
      // Mock data - in real implementation, fetch from reseller_profiles
      setMaxMarkup(0); // Default: no markup allowed
    } catch (error) {
      console.error('Error fetching reseller profile:', error);
    }
  };

  const validatePrice = (originalPrice: number, newPrice: number): boolean => {
    const validation = validateResellerPrice(originalPrice, newPrice, maxMarkup);
    return validation.isValid;
  };

  const handleAddProduct = async () => {
    if (!selectedProduct || !resellerPrice) {
      toast.error('Please select a product and enter a price');
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) {
      toast.error('Product not found');
      return;
    }

    const price = parseFloat(resellerPrice);
    if (!validatePrice(product.price, price)) {
      toast.error(`Price cannot exceed TSh ${(product.price * (1 + (maxMarkup / 100))).toLocaleString()} (${maxMarkup}% markup limit)`);
      return;
    }

    setLoading(true);
    try {
      // Mock implementation - in real version, insert into reseller_products table
      const newResellerProduct: ResellerProduct = {
        id: Date.now().toString(),
        product_id: selectedProduct,
        reseller_price: price,
        original_price: product.price,
        markup_percentage: ((price - product.price) / product.price) * 100,
        is_active: true,
        product
      };

      setResellerProducts(prev => [...prev, newResellerProduct]);
      toast.success('Product added to your catalog');
      setShowAddDialog(false);
      setSelectedProduct('');
      setResellerPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !resellerPrice) return;

    const price = parseFloat(resellerPrice);
    if (!validatePrice(editingProduct.original_price, price)) {
      toast.error(`Price cannot exceed TSh ${(editingProduct.original_price * (1 + (maxMarkup / 100))).toLocaleString()}`);
      return;
    }

    setLoading(true);
    try {
      // Mock implementation
      setResellerProducts(prev => 
        prev.map(rp => 
          rp.id === editingProduct.id 
            ? { 
                ...rp, 
                reseller_price: price,
                markup_percentage: ((price - rp.original_price) / rp.original_price) * 100
              }
            : rp
        )
      );
      
      toast.success('Product price updated');
      setEditingProduct(null);
      setResellerPrice('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Remove this product from your catalog?')) return;

    try {
      setResellerProducts(prev => prev.filter(rp => rp.id !== productId));
      toast.success('Product removed from catalog');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove product');
    }
  };

  const availableProducts = products.filter(p => 
    !resellerProducts.some(rp => rp.product_id === p.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">My Product Catalog</h3>
          <p className="text-sm text-muted-foreground">
            Add products to resell. Maximum markup allowed: {maxMarkup}%
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Product to Catalog</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - TSh {product.price.toLocaleString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedProduct && (
                <div className="space-y-2">
                  <Label>Your Selling Price (TSh)</Label>
                  <Input
                    type="number"
                    value={resellerPrice}
                    onChange={(e) => setResellerPrice(e.target.value)}
                    placeholder="Enter your price"
                  />
                  {selectedProduct && resellerPrice && (
                    <div className="text-sm">
                      {(() => {
                        const product = products.find(p => p.id === selectedProduct);
                        const price = parseFloat(resellerPrice);
                        if (product && price) {
                          const maxAllowed = product.price * (1 + (maxMarkup / 100));
                          const isValid = price <= maxAllowed;
                          const markup = ((price - product.price) / product.price) * 100;
                          
                          return (
                            <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                              {isValid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                              <span>
                                {isValid 
                                  ? `Valid price (${markup.toFixed(1)}% markup)`
                                  : `Exceeds limit! Max: TSh ${maxAllowed.toLocaleString()}`
                                }
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct} disabled={loading}>
                {loading ? 'Adding...' : 'Add Product'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {resellerProducts.length === 0 ? (
            <div className="text-center py-12">
              <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No products in catalog</h3>
              <p className="text-muted-foreground mb-4">Add products to start earning commissions</p>
              <Button onClick={() => setShowAddDialog(true)}>
                Add Your First Product
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Your Price</TableHead>
                  <TableHead>Markup</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resellerProducts.map((resellerProduct) => (
                  <TableRow key={resellerProduct.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {resellerProduct.product?.image_url && (
                          <img 
                            src={resellerProduct.product.image_url} 
                            alt={resellerProduct.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="font-medium">{resellerProduct.product?.name}</p>
                          <p className="text-sm text-muted-foreground">{resellerProduct.product?.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>TSh {resellerProduct.original_price.toLocaleString()}</TableCell>
                    <TableCell>TSh {resellerProduct.reseller_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={resellerProduct.markup_percentage > 0 ? "default" : "secondary"}>
                        {resellerProduct.markup_percentage.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={resellerProduct.is_active ? "default" : "secondary"}>
                        {resellerProduct.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setEditingProduct(resellerProduct);
                            setResellerPrice(resellerProduct.reseller_price.toString());
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteProduct(resellerProduct.id)}
                        >
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

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Price</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <p className="font-medium">{editingProduct.product?.name}</p>
                <p className="text-sm text-muted-foreground">
                  Original Price: TSh {editingProduct.original_price.toLocaleString()}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Your Selling Price (TSh)</Label>
                <Input
                  type="number"
                  value={resellerPrice}
                  onChange={(e) => setResellerPrice(e.target.value)}
                />
                {resellerPrice && (
                  <div className="text-sm">
                    {(() => {
                      const price = parseFloat(resellerPrice);
                      const maxAllowed = editingProduct.original_price * (1 + (maxMarkup / 100));
                      const isValid = price <= maxAllowed;
                      const markup = ((price - editingProduct.original_price) / editingProduct.original_price) * 100;
                      
                      return (
                        <div className={`flex items-center gap-2 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                          {isValid ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                          <span>
                            {isValid 
                              ? `Valid price (${markup.toFixed(1)}% markup)`
                              : `Exceeds limit! Max: TSh ${maxAllowed.toLocaleString()}`
                            }
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={loading}>
              {loading ? 'Updating...' : 'Update Price'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}