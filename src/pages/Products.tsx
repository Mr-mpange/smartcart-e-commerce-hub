import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";

const products = [
  {
    name: "Premium Wireless Headphones",
    price: 89.99,
    originalPrice: 129.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
    rating: 4.5,
    reviews: 128,
    vendor: "AudioTech",
    inStock: true,
  },
  {
    name: "Smart Watch Pro",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
    rating: 4.8,
    reviews: 342,
    vendor: "TechGear",
    inStock: true,
  },
  {
    name: "Laptop Stand Aluminum",
    price: 45.99,
    originalPrice: 59.99,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500",
    rating: 4.3,
    reviews: 89,
    vendor: "OfficeSupply",
    inStock: true,
  },
  {
    name: "Mechanical Keyboard RGB",
    price: 119.99,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=500",
    rating: 4.7,
    reviews: 256,
    vendor: "GamersHub",
    inStock: false,
  },
  {
    name: "4K Webcam",
    price: 79.99,
    originalPrice: 99.99,
    image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500",
    rating: 4.4,
    reviews: 167,
    vendor: "StreamTech",
    inStock: true,
  },
  {
    name: "Wireless Mouse",
    price: 29.99,
    image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500",
    rating: 4.6,
    reviews: 423,
    vendor: "OfficeSupply",
    inStock: true,
  },
];

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">All Products</h1>
          <p className="text-muted-foreground">Discover amazing products from trusted vendors</p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select defaultValue="featured">
              <SelectTrigger className="w-[180px]">
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

            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <ProductCard key={index} {...product} />
          ))}
        </div>

        {/* Load More */}
        <div className="mt-12 text-center">
          <Button size="lg" variant="outline">
            Load More Products
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Products;