import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ProductCard } from '@/components/ProductCard';
import { Star, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  stock_quantity: number;
  vendor_id: string;
  is_active: boolean;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string;
  };
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts();
    }
  }, [product]);

  useEffect(() => {
    if (user && reviews.length > 0) {
      const existingReview = reviews.find(r => r.user_id === user.id);
      if (existingReview) {
        setUserReview(existingReview);
        setRating(existingReview.rating);
        setComment(existingReview.comment || '');
      }
    }
  }, [user, reviews]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('Product not found');
        navigate('/products');
        return;
      }
      setProduct(data);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        return;
      }

      // Fetch profiles for all reviewers
      const userIds = [...new Set(reviewsData?.map(r => r.user_id) || [])];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

        const reviewsWithProfiles: Review[] = (reviewsData || []).map(review => ({
          ...review,
          profile: profilesMap.get(review.user_id) || { full_name: 'Anonymous' }
        }));

        setReviews(reviewsWithProfiles);
      } else {
        setReviews([]);
      }
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .eq('is_active', true)
        .neq('id', product.id)
        .limit(4);

      if (error) throw error;
      setRelatedProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching related products:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    if (!product) return;

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
    } catch (error: any) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error('Please sign in to leave a review');
      navigate('/auth');
      return;
    }

    if (!product) return;

    setSubmittingReview(true);
    try {
      if (userReview) {
        const { error } = await supabase
          .from('reviews')
          .update({ rating, comment })
          .eq('id', userReview.id);

        if (error) throw error;
        toast.success('Review updated');
      } else {
        const { error } = await supabase
          .from('reviews')
          .insert([{ user_id: user.id, product_id: product.id, rating, comment }]);

        if (error) throw error;
        toast.success('Review submitted');
      }
      
      fetchReviews();
    } catch (error: any) {
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRelatedAddToCart = async (productId: string) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      navigate('/auth');
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('id, quantity')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);

        if (error) throw error;
      }

      toast.success('Added to cart');
    } catch (error: any) {
      toast.error('Failed to add to cart');
    }
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Product not found</h1>
          <Button onClick={() => navigate('/products')} className="mt-4">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">{product.name}</h1>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                    />
                  ))}
                </div>
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviews.length} reviews)</span>
              </div>

              <p className="text-4xl font-bold text-primary mb-4">
                TSh {product.price.toLocaleString()}
              </p>

              {product.description && (
                <p className="text-muted-foreground">{product.description}</p>
              )}
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="font-medium">Quantity</label>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.stock_quantity} available
                </span>
              </div>
            </div>

            {/* Add to Cart */}
            <Button 
              size="lg" 
              className="w-full"
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock_quantity === 0}
            >
              {addingToCart ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <ShoppingCart className="mr-2 h-5 w-5" />
              )}
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">Fast Delivery</span>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">Secure Payment</span>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-primary" />
                <span className="text-sm text-muted-foreground">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Write Review */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">
                  {userReview ? 'Update Your Review' : 'Write a Review'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Comment</label>
                    <Textarea
                      placeholder="Share your experience with this product..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="w-full"
                  >
                    {submittingReview ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {userReview ? 'Update Review' : 'Submit Review'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reviews List */}
            <div className="lg:col-span-2 space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>
                            {(review.profile?.full_name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">
                              {review.profile?.full_name || 'Anonymous'}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} 
                              />
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  price={p.price}
                  image={p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                  rating={4.5}
                  reviews={0}
                  vendor="Vendor"
                  inStock={p.stock_quantity > 0}
                  onAddToCart={handleRelatedAddToCart}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
