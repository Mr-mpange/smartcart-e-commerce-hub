import { Navbar } from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Laptop, Smartphone, Headphones, Watch, Camera, Home, Shirt, Book } from "lucide-react";

const categories = [
  { name: "Electronics", icon: Laptop, count: 234, color: "from-blue-500 to-blue-600" },
  { name: "Mobile Phones", icon: Smartphone, count: 156, color: "from-purple-500 to-purple-600" },
  { name: "Audio", icon: Headphones, count: 89, color: "from-pink-500 to-pink-600" },
  { name: "Wearables", icon: Watch, count: 67, color: "from-green-500 to-green-600" },
  { name: "Cameras", icon: Camera, count: 45, color: "from-orange-500 to-orange-600" },
  { name: "Home & Garden", icon: Home, count: 198, color: "from-teal-500 to-teal-600" },
  { name: "Fashion", icon: Shirt, count: 312, color: "from-red-500 to-red-600" },
  { name: "Books", icon: Book, count: 123, color: "from-indigo-500 to-indigo-600" },
];

const Categories = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground">Browse products by category</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Card 
                key={index} 
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count} products</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Featured Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Popular in Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-primary to-accent">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-primary-foreground">
                    <Laptop className="h-16 w-16 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold">Electronics Sale</h3>
                    <p className="text-sm opacity-90">Up to 50% off</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-pink-500 to-purple-600">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Shirt className="h-16 w-16 mx-auto mb-2" />
                    <h3 className="text-2xl font-bold">Fashion Week</h3>
                    <p className="text-sm opacity-90">New arrivals daily</p>
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