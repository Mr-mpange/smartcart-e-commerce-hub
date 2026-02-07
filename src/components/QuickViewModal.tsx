import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductViewer3D } from './ProductViewer3D';
import { ShoppingCart, Star, Eye, Expand, ExternalLink, Minus, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ColorSwatch {
  name: string;
  color: string;
  image?: string;
}

interface QuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    images: string[];
    rating?: number;
    reviews?: number;
    vendor?: string;
    inStock?: boolean;
    colorSwatches?: ColorSwatch[];
    category?: string;
    description?: string;
  };
}

export function QuickViewModal({ isOpen, onClose, product }: QuickViewModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFullViewer, setIsFullViewer] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      onClose();
      return;
    }

    if (product.id === 'demo') {
      toast.success(`${product.name} added to cart!`);
      return;
    }

    setAddingToCart(true);
    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + quantity })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: product.id, quantity }]);

        if (error) throw error;
      }

      toast.success(`Added ${quantity} item(s) to cart`);
      onClose();
    } catch (error: any) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleViewProduct = () => {
    onClose();
    if (product.id !== 'demo') {
      navigate(`/product/${product.id}`);
    }
  };

  if (isFullViewer) {
    return (
      <ProductViewer3D
        images={product.images}
        productName={product.name}
        colorSwatches={product.colorSwatches}
        isOpen={isOpen}
        onClose={() => setIsFullViewer(false)}
        isModal
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">{product.name} - Quick View</DialogTitle>
        
        <div className="grid md:grid-cols-2 gap-0">
          {/* 3D Viewer Section */}
          <div className="relative bg-muted/30">
            <ProductViewer3D
              images={product.images}
              productName={product.name}
              colorSwatches={product.colorSwatches}
              className="min-h-[400px] md:min-h-[500px] rounded-none"
            />
            
            {/* Expand to full viewer */}
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm"
              onClick={() => setIsFullViewer(true)}
            >
              <Expand className="h-4 w-4 mr-2" />
              Full View
            </Button>
          </div>

          {/* Product Info Section */}
          <div className="p-6 flex flex-col">
            <div className="flex-1 space-y-4">
              {/* Category & Vendor */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.category && (
                  <Badge variant="secondary">{product.category}</Badge>
                )}
                {discount > 0 && (
                  <Badge className="bg-destructive">-{discount}%</Badge>
                )}
              </div>

              {/* Product Name */}
              <h2 className="text-2xl font-bold">{product.name}</h2>

              {/* Vendor */}
              {product.vendor && (
                <p className="text-sm text-muted-foreground">
                  Sold by: <span className="text-foreground font-medium">{product.vendor}</span>
                </p>
              )}

              {/* Rating */}
              {product.rating !== undefined && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`h-4 w-4 ${star <= Math.round(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                      />
                    ))}
                  </div>
                  <span className="font-medium">{product.rating}</span>
                  {product.reviews !== undefined && (
                    <span className="text-muted-foreground">({product.reviews} reviews)</span>
                  )}
                </div>
              )}

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground text-sm line-clamp-3">
                  {product.description}
                </p>
              )}

              {/* Price */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">
                    TSh {product.price.toLocaleString()}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-muted-foreground line-through">
                      TSh {product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-sm text-primary font-medium">
                    You save TSh {(product.originalPrice! - product.price).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${product.inStock !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className={`text-sm font-medium ${product.inStock !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {product.inStock !== false ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              {product.inStock !== false && (
                <div className="flex items-center gap-4">
                  <span className="font-medium">Quantity:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-semibold">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-6 border-t mt-6">
              <Button 
                size="lg" 
                className="w-full bg-gradient-primary"
                onClick={handleAddToCart}
                disabled={addingToCart || product.inStock === false}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full"
                onClick={handleViewProduct}
              >
                <ExternalLink className="mr-2 h-5 w-5" />
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickViewModal;
