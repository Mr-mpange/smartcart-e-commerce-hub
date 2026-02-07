import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Eye, RotateCcw } from 'lucide-react';
import { QuickViewModal } from './QuickViewModal';
import { cn } from '@/lib/utils';

interface ColorSwatch {
  name: string;
  color: string;
  image?: string;
}

interface ProductCardWithViewerProps {
  id?: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  reviews: number;
  vendor: string;
  inStock: boolean;
  category?: string;
  description?: string;
  colorSwatches?: ColorSwatch[];
  onAddToCart?: (productId: string) => void;
}

export const ProductCardWithViewer = ({
  id = 'demo',
  name,
  price,
  originalPrice,
  image,
  images,
  rating,
  reviews,
  vendor,
  inStock,
  category,
  description,
  colorSwatches,
  onAddToCart
}: ProductCardWithViewerProps) => {
  const navigate = useNavigate();
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  // Generate multiple images for 360 view if not provided
  const productImages = images || [
    image,
    image.replace('w=500', 'w=501'), // Slightly different for demo
    image.replace('w=500', 'w=502'),
    image.replace('w=500', 'w=503'),
  ];

  // Default color swatches if none provided
  const defaultSwatches: ColorSwatch[] = colorSwatches || [
    { name: 'Default', color: '#374151' },
    { name: 'Red', color: '#DC2626' },
    { name: 'Blue', color: '#2563EB' },
    { name: 'Green', color: '#16A34A' },
    { name: 'Gold', color: '#EAB308' },
  ];

  const handleCardClick = () => {
    if (id && id !== 'demo') {
      navigate(`/product/${id}`);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsQuickViewOpen(true);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(id);
    }
  };

  return (
    <>
      <Card 
        className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden">
          <img
            src={image}
            alt={name}
            className={cn(
              "w-full h-64 object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <Badge className="bg-destructive">-{discount}%</Badge>
            )}
            <Badge className="bg-primary/90 flex items-center gap-1">
              <RotateCcw className="h-3 w-3" />
              360°
            </Badge>
          </div>

          {/* Out of Stock Overlay */}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}

          {/* Quick View Button */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}>
            <Button
              variant="secondary"
              size="lg"
              className="gap-2 bg-background/90 hover:bg-background"
              onClick={handleQuickView}
            >
              <Eye className="h-5 w-5" />
              Quick View 3D
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground">{vendor}</div>
          <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
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

          {/* Color Swatches Preview */}
          <div className="flex items-center gap-1 pt-1">
            {defaultSwatches.slice(0, 4).map((swatch, index) => (
              <div
                key={index}
                className="w-5 h-5 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: swatch.color }}
                title={swatch.name}
              />
            ))}
            {defaultSwatches.length > 4 && (
              <span className="text-xs text-muted-foreground ml-1">
                +{defaultSwatches.length - 4}
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

      {/* Quick View Modal */}
      <QuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        product={{
          id,
          name,
          price,
          originalPrice,
          images: productImages,
          rating,
          reviews,
          vendor,
          inStock,
          category,
          description,
          colorSwatches: defaultSwatches
        }}
      />
    </>
  );
};

export default ProductCardWithViewer;
