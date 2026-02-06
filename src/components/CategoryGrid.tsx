import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";

const categories = [
  { 
    name: "Electronics", 
    icon: "📱",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop",
    count: "2.5K+ Products"
  },
  { 
    name: "Fashion", 
    icon: "👗",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&h=200&fit=crop",
    count: "5K+ Products"
  },
  { 
    name: "Home & Garden", 
    icon: "🏠",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop",
    count: "3K+ Products"
  },
  { 
    name: "Beauty", 
    icon: "💄",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop",
    count: "1.8K+ Products"
  },
  { 
    name: "Sports", 
    icon: "⚽",
    image: "https://images.unsplash.com/photo-1461896836934- voices-4-1dde7ec9d6b4?w=200&h=200&fit=crop",
    count: "2K+ Products"
  },
  { 
    name: "Toys", 
    icon: "🧸",
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=200&h=200&fit=crop",
    count: "1.2K+ Products"
  },
  { 
    name: "Automotive", 
    icon: "🚗",
    image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=200&fit=crop",
    count: "900+ Products"
  },
  { 
    name: "Books", 
    icon: "📚",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=200&fit=crop",
    count: "4K+ Products"
  }
];

export const CategoryGrid = () => {
  const navigate = useNavigate();

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Browse our wide range of categories</p>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="p-4 text-center cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all group"
              onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
            >
              <div className="relative w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-secondary">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                {category.name}
              </h3>
              <p className="text-xs text-muted-foreground">{category.count}</p>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => navigate('/categories')}
            className="text-primary hover:underline font-medium"
          >
            View All Categories →
          </button>
        </div>
      </div>
    </section>
  );
};
