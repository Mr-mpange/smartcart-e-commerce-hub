import { useNavigate } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const products = [
  {
    name: "Premium Wireless Headphones",
    price: 89999,
    originalPrice: 129999,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    rating: 4.8,
    reviews: 234,
    vendor: "TechVendor Pro",
    inStock: true
  },
  {
    name: "Smart Fitness Watch",
    price: 199999,
    originalPrice: 249999,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    rating: 4.6,
    reviews: 189,
    vendor: "FitGear Store",
    inStock: true
  },
  {
    name: "Designer Backpack",
    price: 59999,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 412,
    vendor: "Fashion Hub",
    inStock: true
  },
  {
    name: "Professional Camera Lens",
    price: 449999,
    originalPrice: 599999,
    image: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=500&h=500&fit=crop",
    rating: 4.7,
    reviews: 156,
    vendor: "PhotoPro Shop",
    inStock: true
  },
  {
    name: "Ergonomic Office Chair",
    price: 299999,
    image: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=500&h=500&fit=crop",
    rating: 4.5,
    reviews: 98,
    vendor: "Office Essentials",
    inStock: false
  },
  {
    name: "Portable Bluetooth Speaker",
    price: 49999,
    originalPrice: 79999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop",
    rating: 4.4,
    reviews: 302,
    vendor: "AudioMax",
    inStock: true
  },
  {
    name: "Organic Green Tea Set",
    price: 24999,
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 567,
    vendor: "Natural Goods",
    inStock: true
  },
  {
    name: "Gaming Keyboard RGB",
    price: 129999,
    originalPrice: 179999,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&h=500&fit=crop",
    rating: 4.7,
    reviews: 223,
    vendor: "Gamers Paradise",
    inStock: true
  }
];

export const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAddToCart = async (productIndex: number) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    const product = products[productIndex];
    
    // For featured products (demo), we'll show a success message
    // In production, these would be real products from the database
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Products</h2>
          <p className="text-xl text-muted-foreground">
            Discover our handpicked selection of trending items
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard 
              key={index} 
              {...product} 
              onAddToCart={() => handleAddToCart(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
