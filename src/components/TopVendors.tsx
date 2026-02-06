import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, Store, ArrowRight } from "lucide-react";

const topVendors = [
  {
    id: 1,
    name: "TechHub Electronics",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=150&fit=crop",
    rating: 4.9,
    reviews: 12450,
    products: 234,
    verified: true,
    badge: "Top Rated"
  },
  {
    id: 2,
    name: "Fashion Forward",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=150&fit=crop",
    rating: 4.8,
    reviews: 8920,
    products: 567,
    verified: true,
    badge: "Best Seller"
  },
  {
    id: 3,
    name: "Home Essentials",
    logo: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400&h=150&fit=crop",
    rating: 4.7,
    reviews: 6780,
    products: 445,
    verified: true,
    badge: "Trusted"
  },
  {
    id: 4,
    name: "Sports Zone",
    logo: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=100&h=100&fit=crop",
    banner: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=150&fit=crop",
    rating: 4.8,
    reviews: 5430,
    products: 312,
    verified: true,
    badge: "Popular"
  }
];

export const TopVendors = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-bold">Top Vendors</h2>
              <p className="text-muted-foreground">Shop from our verified sellers</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/vendors')}>
            All Vendors <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {topVendors.map((vendor) => (
            <Card 
              key={vendor.id}
              className="overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => navigate('/vendors')}
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={vendor.banner}
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <Badge className="absolute top-3 right-3 bg-primary">{vendor.badge}</Badge>
              </div>
              
              <CardContent className="p-4 -mt-8 relative">
                <div className="flex items-end gap-3 mb-3">
                  <div className="relative">
                    <img
                      src={vendor.logo}
                      alt={vendor.name}
                      className="w-16 h-16 rounded-full border-4 border-background object-cover"
                    />
                    {vendor.verified && (
                      <CheckCircle className="absolute -bottom-1 -right-1 h-5 w-5 text-primary fill-background" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <h3 className="font-semibold truncate">{vendor.name}</h3>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{vendor.rating}</span>
                      <span className="text-xs text-muted-foreground">({vendor.reviews.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{vendor.products} Products</span>
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    Visit Store →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
