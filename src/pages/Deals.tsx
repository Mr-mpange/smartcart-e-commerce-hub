import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Zap } from "lucide-react";

const deals = [
  {
    name: "Gaming Laptop RTX 4060",
    price: 899.99,
    originalPrice: 1299.99,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
    rating: 4.8,
    reviews: 89,
    vendor: "TechDeals",
    inStock: true,
  },
  {
    name: "Professional Camera Bundle",
    price: 449.99,
    originalPrice: 699.99,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    rating: 4.7,
    reviews: 124,
    vendor: "PhotoPro",
    inStock: true,
  },
  {
    name: "Bluetooth Speaker Premium",
    price: 59.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    rating: 4.5,
    reviews: 234,
    vendor: "SoundWave",
    inStock: true,
  },
  {
    name: "Smart Home Hub",
    price: 79.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1558089687-e16a5f4a5a8c?w=500",
    rating: 4.6,
    reviews: 167,
    vendor: "SmartLife",
    inStock: true,
  },
];

const Deals = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Banner */}
        <Card className="mb-8 overflow-hidden bg-gradient-hero">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-8 w-8 text-primary-foreground" />
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                Limited Time
              </Badge>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-2">
              Hot Deals & Offers
            </h1>
            <p className="text-lg text-primary-foreground/90 mb-6">
              Save big on amazing products from top vendors
            </p>
            <div className="flex items-center gap-2 text-primary-foreground">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Deals ending soon!</span>
            </div>
          </CardContent>
        </Card>

        {/* Deal Categories */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Flash Sales</h3>
                  <p className="text-sm text-muted-foreground">Up to 70% off</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Daily Deals</h3>
                  <p className="text-sm text-muted-foreground">New every 24h</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group cursor-pointer hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Lightning Deals</h3>
                  <p className="text-sm text-muted-foreground">Limited stock</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Deals Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Today's Best Deals</h2>
            <span className="text-sm text-muted-foreground">24 hours left</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((product, index) => (
              <ProductCard key={index} {...product} />
            ))}
          </div>
        </div>

        {/* More Deals Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More Amazing Deals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((product, index) => (
              <ProductCard key={`more-${index}`} {...product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;