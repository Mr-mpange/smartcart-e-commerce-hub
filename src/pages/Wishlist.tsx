import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Heart } from 'lucide-react';

interface WishlistProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  stock_quantity: number;
  vendor_id: string;
}

interface WishlistItem {
  id: string;
  product_id: string;
  created_at: string;
  product?: WishlistProduct;
}

const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorMap, setVendorMap] = useState<Map<string, string>>(new Map());
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchWishlist();
      fetchVendors();
    }
  }, [user]);

  const fetchVendors = async () => {
    // Fetch all vendors, not just approved ones, so wishlist items show vendor names
    const { data, error } = await supabase
      .from('vendor_profiles')
      .select('user_id, business_name, is_approved');
    
    // Create map with all vendors, but indicate approval status
    const vendorMap = new Map();
    data?.forEach(v => {
      const name = v.is_approved ? v.business_name : `${v.business_name} (Pending)`;
      vendorMap.set(v.user_id, name);
    });
    setVendorMap(vendorMap);
  };

  const fetchWishlist = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id, product_id, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch product details
      const productIds = (data || []).map(w => w.product_id);
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from('products')
          .select('id, name, price, image_url, stock_quantity, vendor_id')
          .in('id', productIds);

        const productMap = new Map(products?.map(p => [p.id, p]) || []);
        setItems((data || []).map(w => ({ ...w, product: productMap.get(w.product_id) })));
      } else {
        setItems([]);
      }
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user!.id)
        .eq('product_id', productId);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.product_id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) return;
    try {
      const { data: existing } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existing) {
        await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id);
      } else {
        await supabase.from('cart_items').insert({ user_id: user.id, product_id: productId, quantity: 1 });
      }
      toast.success('Added to cart');
    } catch {
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
        title="My Wishlist"
        subtitle={`${items.length} saved item${items.length !== 1 ? 's' : ''}`}
        backgroundImage="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1920&h=600&fit=crop"
        overlay="dark"
      />

      <div className="container mx-auto px-4 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground/30" />
            <h2 className="text-xl font-semibold">Your wishlist is empty</h2>
            <p className="text-muted-foreground">Browse products and tap the heart icon to save items you love.</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => item.product && (
              <ProductCard
                key={item.id}
                id={item.product.id}
                name={item.product.name}
                price={item.product.price}
                image={item.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                rating={0}
                reviews={0}
                vendor={vendorMap.get(item.product.vendor_id) || 'Vendor'}
                inStock={item.product.stock_quantity > 0}
                isWishlisted={true}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
