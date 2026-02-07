import { useNavigate } from "react-router-dom";
import { ProductCardWithViewer } from "./ProductCardWithViewer";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, Package } from "lucide-react";
import { toast } from "sonner";

const products = [
  {
    name: "MacBook Pro 14\" M3 Chip",
    price: 4899999,
    originalPrice: 5499999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 1234,
    vendor: "Apple Store TZ",
    inStock: true
  },
  {
    name: "iPhone 15 Pro Max 256GB",
    price: 3299999,
    originalPrice: 3599999,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&h=500&fit=crop",
    rating: 4.8,
    reviews: 2189,
    vendor: "Apple Store TZ",
    inStock: true
  },
  {
    name: "Designer Leather Handbag",
    price: 299999,
    originalPrice: 459999,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&h=500&fit=crop",
    rating: 4.7,
    reviews: 892,
    vendor: "Fashion Hub",
    inStock: true
  },
  {
    name: "Canon EOS R5 Camera Body",
    price: 8999999,
    originalPrice: 9999999,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&h=500&fit=crop",
    rating: 4.9,
    reviews: 456,
    vendor: "PhotoPro Shop",
    inStock: true
  },
  {
    name: "LG 55\" OLED 4K Smart TV",
    price: 2499999,
    originalPrice: 2999999,
    image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop",
    rating: 4.8,
    reviews: 678,
    vendor: "Electronics Hub",
    inStock: true
  },
  {
    name: "Dyson V15 Vacuum Cleaner",
    price: 1599999,
    originalPrice: 1899999,
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&h=500&fit=crop",
    rating: 4.7,
    reviews: 345,
    vendor: "Home Essentials",
    inStock: false
  },
  {
    name: "Ray-Ban Aviator Sunglasses",
    price: 249999,
    originalPrice: 349999,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=500&h=500&fit=crop",
    rating: 4.6,
    reviews: 1567,
    vendor: "Fashion Forward",
    inStock: true
  },
  {
    name: "Bose QuietComfort Earbuds",
    price: 549999,
    originalPrice: 699999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
    rating: 4.8,
    reviews: 923,
    vendor: "AudioMax",
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
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Featured Products</h2>
              <p className="text-muted-foreground">Handpicked selection of trending items</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/products')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCardWithViewer 
              key={index} 
              {...product}
              id="demo"
              colorSwatches={[
                { name: 'Space Gray', color: '#4B5563' },
                { name: 'Silver', color: '#9CA3AF' },
                { name: 'Gold', color: '#F59E0B' },
                { name: 'Blue', color: '#3B82F6' },
              ]}
              onAddToCart={() => handleAddToCart(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
