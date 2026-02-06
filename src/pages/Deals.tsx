import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Clock, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const deals = [
  {
    name: "Gaming Laptop RTX 4060",
    price: 899999,
    originalPrice: 1299999,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500",
    rating: 4.8,
    reviews: 89,
    vendor: "TechDeals",
    inStock: true,
  },
  {
    name: "Professional Camera Bundle",
    price: 449999,
    originalPrice: 699999,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500",
    rating: 4.7,
    reviews: 124,
    vendor: "PhotoPro",
    inStock: true,
  },
  {
    name: "Bluetooth Speaker Premium",
    price: 59999,
    originalPrice: 99999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500",
    rating: 4.5,
    reviews: 234,
    vendor: "SoundWave",
    inStock: true,
  },
  {
    name: "Smart Home Hub",
    price: 79999,
    originalPrice: 129999,
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=500",
    rating: 4.6,
    reviews: 167,
    vendor: "SmartLife",
    inStock: true,
  },
  {
    name: "Wireless Earbuds Pro",
    price: 149999,
    originalPrice: 249999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500",
    rating: 4.9,
    reviews: 567,
    vendor: "AudioMax",
    inStock: true,
  },
  {
    name: "4K Action Camera",
    price: 299999,
    originalPrice: 449999,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
    rating: 4.7,
    reviews: 234,
    vendor: "AdventureCam",
    inStock: true,
  },
  {
    name: "Smart Watch Series 5",
    price: 399999,
    originalPrice: 549999,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500",
    rating: 4.8,
    reviews: 892,
    vendor: "WearTech",
    inStock: true,
  },
  {
    name: "Mechanical Gaming Keyboard",
    price: 179999,
    originalPrice: 279999,
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500",
    rating: 4.6,
    reviews: 445,
    vendor: "GamerZone",
    inStock: true,
  },
];

const Deals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleAddToCart = (productIndex: number) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    const product = deals[productIndex];
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header with Background */}
      <PageHeader
        title="Hot Deals & Offers"
        subtitle="Save big on amazing products from top vendors. Limited time offers you don't want to miss!"
        backgroundImage="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=1920&h=600&fit=crop"
        overlay="primary"
      >
        <Badge variant="secondary" className="bg-white/20 text-white border-0 px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          Deals ending soon!
        </Badge>
      </PageHeader>

      <div className="container mx-auto px-4 py-8">

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
              <ProductCard 
                key={index} 
                {...product} 
                onAddToCart={() => handleAddToCart(index)}
              />
            ))}
          </div>
        </div>

        {/* More Deals Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">More Amazing Deals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {deals.map((product, index) => (
              <ProductCard 
                key={`more-${index}`} 
                {...product} 
                onAddToCart={() => handleAddToCart(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deals;