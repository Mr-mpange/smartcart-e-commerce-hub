import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  vendor_id: string;
  created_at: string;
  avg_rating?: number;
  review_count?: number;
  vendor_name?: string;
}

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("featured");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data: approvedVendors } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_name')
        .eq('is_approved', true);

      const approvedIds = approvedVendors?.map(v => v.user_id) || [];
      const vendorMap = new Map(approvedVendors?.map(v => [v.user_id, v.business_name]) || []);

      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (approvedIds.length > 0) {
        query = query.in('vendor_id', approvedIds);
      } else {
        query = query.in('vendor_id', ['none']);
      }

      const { data, error } = await query;
      if (error) throw error;

      const productIds = (data || []).map(p => p.id);
      let reviewStats = new Map<string, { avg: number; count: number }>();
      if (productIds.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .in('product_id', productIds);

        if (reviews) {
          const grouped = new Map<string, number[]>();
          reviews.forEach(r => {
            const arr = grouped.get(r.product_id) || [];
            arr.push(r.rating);
            grouped.set(r.product_id, arr);
          });
          grouped.forEach((ratings, pid) => {
            reviewStats.set(pid, {
              avg: Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10,
              count: ratings.length,
            });
          });
        }
      }

      setProducts(
        (data || []).map((p) => ({
          ...p,
          avg_rating: reviewStats.get(p.id)?.avg || 0,
          review_count: reviewStats.get(p.id)?.count || 0,
          vendor_name: vendorMap.get(p.vendor_id) || 'Vendor',
        }))
      );
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = [...products]
    .filter(p => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.vendor_name || '').toLowerCase().includes(q);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'rating': return (b.avg_rating || 0) - (a.avg_rating || 0);
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0; // featured = original order
      }
    });

  const handleAddToCart = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);
        if (error) throw error;
      }

      toast.success('Added to cart');
    } catch (error: any) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
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
      
      <PageHeader
        title="All Products"
        subtitle="Discover amazing products from trusted vendors across East Africa. Quality guaranteed with buyer protection."
        backgroundImage="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop"
        overlay="dark"
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 -mt-6 relative z-10">
          <div className="bg-background rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" className="h-12 w-12">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No products match your search.' : 'No products available at the moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                rating={product.avg_rating || 0}
                reviews={product.review_count || 0}
                vendor={product.vendor_name || 'Vendor'}
                inStock={product.stock_quantity > 0}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
