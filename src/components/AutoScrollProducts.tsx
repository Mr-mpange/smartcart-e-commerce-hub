import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

const scrollProducts = [
  {
    name: "MacBook Pro 14\"",
    price: 4899999,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=300&fit=crop",
    rating: 4.9,
  },
  {
    name: "iPhone 15 Pro Max",
    price: 3299999,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=300&h=300&fit=crop",
    rating: 4.8,
  },
  {
    name: "Nike Air Max 270",
    price: 189999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
    rating: 4.7,
  },
  {
    name: "Sony WH-1000XM5",
    price: 749999,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300&h=300&fit=crop",
    rating: 4.9,
  },
  {
    name: "Samsung Galaxy S24",
    price: 2899999,
    image: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=300&h=300&fit=crop",
    rating: 4.8,
  },
  {
    name: "Canon EOS R5",
    price: 8999999,
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=300&fit=crop",
    rating: 4.9,
  },
  {
    name: "Designer Handbag",
    price: 299999,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=300&h=300&fit=crop",
    rating: 4.7,
  },
  {
    name: "Smart Watch Series X",
    price: 159999,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop",
    rating: 4.6,
  },
  {
    name: "Bose QuietComfort",
    price: 549999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop",
    rating: 4.8,
  },
  {
    name: "Ray-Ban Aviator",
    price: 249999,
    image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&h=300&fit=crop",
    rating: 4.6,
  },
];

export const AutoScrollProducts = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animationId: number;
    let scrollSpeed = 1;

    const scroll = () => {
      if (!isPaused && container) {
        container.scrollLeft += scrollSpeed;
        // Reset scroll when halfway (we duplicate items)
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused]);

  // Duplicate products for seamless loop
  const allProducts = [...scrollProducts, ...scrollProducts];

  return (
    <section className="py-10 bg-secondary/20 overflow-hidden">
      <div className="container mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Explore Products</h2>
            <p className="text-muted-foreground text-sm">Auto-curated picks flowing just for you</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/products")}>
            View All
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-hidden cursor-grab px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {allProducts.map((product, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-48 group cursor-pointer"
            onClick={() => navigate("/products")}
          >
            <div className="relative rounded-xl overflow-hidden shadow-md bg-card hover:shadow-xl transition-all">
              <img
                src={product.image}
                alt={product.name}
                className="w-48 h-48 object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2">
                <Badge className="bg-primary/90 text-xs">
                  <Star className="h-3 w-3 fill-current mr-1" />
                  {product.rating}
                </Badge>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <ShoppingCart className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-2 px-1">
              <p className="text-sm font-medium line-clamp-1">{product.name}</p>
              <p className="text-sm font-bold text-primary">
                TSh {product.price.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
