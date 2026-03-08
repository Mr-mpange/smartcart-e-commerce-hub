import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Heart } from "lucide-react";

interface ProductCardProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  vendor: string;
  inStock: boolean;
  isWishlisted?: boolean;
  onAddToCart?: (productId: string) => void;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  reviews,
  vendor,
  inStock,
  isWishlisted,
  onAddToCart,
  onToggleWishlist,
}: ProductCardProps) => {
  const navigate = useNavigate();
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const handleCardClick = () => {
    if (id && id !== 'demo') {
      navigate(`/product/${id}`);
    }
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && onAddToCart) {
      onAddToCart(id);
    } else if (onAddToCart) {
      onAddToCart('demo');
    }
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id && onToggleWishlist) {
      onToggleWishlist(id);
    }
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {discount > 0 && (
          <Badge className="absolute top-3 right-3 bg-destructive">
            -{discount}%
          </Badge>
        )}
        {onToggleWishlist && (
          <button
            onClick={handleWishlistClick}
            className="absolute top-3 left-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Heart
              className={`h-5 w-5 transition-colors ${
                isWishlisted
                  ? 'fill-destructive text-destructive'
                  : 'text-muted-foreground hover:text-destructive'
              }`}
            />
          </button>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-semibold">Out of Stock</span>
          </div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-2">
        <div className="text-sm text-muted-foreground">{vendor}</div>
        <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-4 w-4 ${
                star <= Math.round(rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
          <span className="text-sm font-medium ml-1">{rating > 0 ? rating : '—'}</span>
          <span className="text-sm text-muted-foreground">({reviews})</span>
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-primary">
            TSh {price.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              TSh {originalPrice.toLocaleString()}
            </span>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Button 
          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity" 
          disabled={!inStock}
          onClick={handleAddToCartClick}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
