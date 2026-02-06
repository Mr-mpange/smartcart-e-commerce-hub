import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, TrendingUp, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const trendingProducts = [
  {
    id: "trend-1",
    name: "Apple AirPods Pro 2nd Generation",
    price: 549999,
    originalPrice: 699999,
    image: "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 2345,
    vendor: "Apple Store TZ",
    sales: "5K+ sold"
  },
  {
    id: "trend-2",
    name: "Samsung Galaxy S24 Ultra 256GB",
    price: 2899999,
    originalPrice: 3199999,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 1892,
    vendor: "Samsung Official",
    sales: "3K+ sold"
  },
  {
    id: "trend-3",
    name: "Nike Air Max 270 React",
    price: 189999,
    originalPrice: 249999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 3456,
    vendor: "Nike Tanzania",
    sales: "8K+ sold"
  },
  {
    id: "trend-4",
    name: "Sony WH-1000XM5 Headphones",
    price: 749999,
    originalPrice: 899999,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 4567,
    vendor: "Sony Electronics",
    sales: "4K+ sold"
  }
];

export const TrendingProducts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAddToCart = (productName: string) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }
    toast.success(`${productName} added to cart!`);
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Trending Now</h2>
              <p className="text-muted-foreground">Most popular products this week</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/products')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingProducts.map((product) => {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            
            return (
              <Card 
                key={product.id}
                className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => navigate('/products')}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-red-500">
                    -{discount}%
                  </Badge>
                  <Badge className="absolute top-3 right-3 bg-primary/90">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                </div>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">{product.vendor}</p>
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({product.reviews})</span>
                    <span className="text-xs text-muted-foreground ml-auto">{product.sales}</span>
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-primary">
                      TSh {product.price.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      TSh {product.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-gradient-primary hover:opacity-90"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product.name);
                    }}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
