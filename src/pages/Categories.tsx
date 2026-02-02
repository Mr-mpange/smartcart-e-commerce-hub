import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { useState } from "react";

const categories = [
  { 
    name: "Electronics", 
    count: 234, 
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop",
    trending: true
  },
  { 
    name: "Mobile Phones", 
    count: 156, 
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop",
    trending: true
  },
  { 
    name: "Audio", 
    count: 89, 
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Wearables", 
    count: 67, 
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
    trending: true
  },
  { 
    name: "Cameras", 
    count: 45, 
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Home & Garden", 
    count: 198, 
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Fashion", 
    count: 312, 
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
    trending: true
  },
  { 
    name: "Books", 
    count: 123, 
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Sports & Outdoors", 
    count: 178, 
    image: "https://images.unsplash.com/photo-1461896836934- voices-4-1dde7ec9d6b4?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Beauty & Health", 
    count: 245, 
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop",
    trending: true
  },
  { 
    name: "Toys & Games", 
    count: 89, 
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=400&h=300&fit=crop",
    trending: false
  },
  { 
    name: "Automotive", 
    count: 134, 
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
    trending: false
  },
];

const Categories = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const trendingCategories = categories.filter(cat => cat.trending);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with Search */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground mb-6">Browse products by category</p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search categories..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Trending Categories */}
        {!searchTerm && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingCategories.slice(0, 4).map((category, index) => (
                <Card 
                  key={index} 
                  className="group cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                >
                  <div className="relative h-32">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-yellow-400" />
                        <span className="text-white font-semibold text-sm">{category.name}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Categories Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6">All Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category, index) => (
              <Card 
                key={index} 
                className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden"
                onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {category.trending && (
                    <Badge className="absolute top-3 right-3 bg-primary">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{category.count} products</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Featured Banners */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Featured Collections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="overflow-hidden cursor-pointer group"
              onClick={() => navigate('/deals')}
            >
              <div className="relative h-56">
                <img 
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop" 
                  alt="Electronics Sale"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/40 flex items-center">
                  <div className="p-8 text-primary-foreground">
                    <Badge variant="secondary" className="mb-3">Limited Time</Badge>
                    <h3 className="text-3xl font-bold mb-2">Electronics Sale</h3>
                    <p className="text-lg opacity-90 mb-4">Up to 50% off on gadgets</p>
                    <Button variant="secondary">
                      Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card 
              className="overflow-hidden cursor-pointer group"
              onClick={() => navigate('/products?category=Fashion')}
            >
              <div className="relative h-56">
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=400&fit=crop" 
                  alt="Fashion Week"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/90 to-purple-600/40 flex items-center">
                  <div className="p-8 text-white">
                    <Badge className="mb-3 bg-white/20 border-0">New Arrivals</Badge>
                    <h3 className="text-3xl font-bold mb-2">Fashion Week</h3>
                    <p className="text-lg opacity-90 mb-4">Trending styles daily</p>
                    <Button className="bg-white text-purple-600 hover:bg-white/90">
                      Explore <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;