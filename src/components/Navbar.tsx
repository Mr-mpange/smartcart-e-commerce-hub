import { ShoppingCart, User, Search, Menu, LogOut, Package, LayoutDashboard, Shield, Wallet, Truck, Heart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Navbar = ({ hideMainNav = false }: { hideMainNav?: boolean }) => {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFetchCounts = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchCartCount();
      fetchWishlistCount();
    }, 300); // 300ms debounce
  }, []);

  useEffect(() => {
    if (user) {
      fetchCartCount();
      fetchWishlistCount();
      const channel = supabase
        .channel('cart-count')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` }, debouncedFetchCounts)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlists', filter: `user_id=eq.${user.id}` }, debouncedFetchCounts)
        .subscribe();
      return () => { 
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
        supabase.removeChannel(channel); 
      };
    } else {
      setCartCount(0);
      setWishlistCount(0);
    }
  }, [user, debouncedFetchCounts]);

  const fetchCartCount = async () => {
    try {
      const { count } = await supabase
        .from('cart_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      
      setCartCount(count || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const { count } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);
      setWishlistCount(count || 0);
    } catch (error) {
      console.error('Error fetching wishlist count:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      console.log('Starting sign out...');
      await signOut();
      console.log('Sign out completed, navigating to home');
      // Add a small delay to ensure state is cleared
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      // Force navigation even if sign out fails
      navigate('/', { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary" />
              <span className="text-xl font-bold">SmartCart</span>
            </Link>
            
            {/* Desktop Navigation */}
            {!hideMainNav && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/products" className="text-sm font-medium hover:text-primary transition-colors">
                  Products
                </Link>
                <Link to="/categories" className="text-sm font-medium hover:text-primary transition-colors">
                  Categories
                </Link>
                <Link to="/deals" className="text-sm font-medium hover:text-primary transition-colors">
                  Deals
                </Link>
                <Link to="/vendors" className="text-sm font-medium hover:text-primary transition-colors">
                  Vendors
                </Link>
              </div>
            )}
          </div>

          {/* Search Bar */}
          {!hideMainNav && (
            <div className="hidden lg:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10 w-full"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!hideMainNav && (
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            {user ? (
              <>
                {!hideMainNav && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative"
                      onClick={() => navigate('/wishlist')}
                    >
                      <Heart className="h-5 w-5" />
                      {wishlistCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive">
                          {wishlistCount}
                        </Badge>
                      )}
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="relative"
                      onClick={() => navigate('/cart')}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {cartCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                          {cartCount}
                        </Badge>
                      )}
                    </Button>
                  </>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      My Orders
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wallet')}>
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </DropdownMenuItem>
                    {userRole === 'vendor' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/vendor/dashboard')}>
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Vendor Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    {userRole === 'delivery_rider' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/rider/dashboard')}>
                          <Truck className="mr-2 h-4 w-4" />
                          Rider Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    {userRole === 'reseller' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/reseller/dashboard')}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Reseller Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    {userRole === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}

            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex flex-col gap-2 py-4">
              {!hideMainNav && (
                <>
                  <Link 
                    to="/products" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Products
                  </Link>
                  <Link 
                    to="/categories" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Categories
                  </Link>
                  <Link 
                    to="/deals" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Deals
                  </Link>
                  <Link 
                    to="/vendors" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vendors
                  </Link>
                </>
              )}
              {user && (
                <>
                  <div className="border-t my-2"></div>
                  <Link 
                    to="/profile" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link 
                    to="/orders" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4" />
                    My Orders
                  </Link>
                  <Link 
                    to="/wallet" 
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Wallet className="h-4 w-4" />
                    Wallet
                  </Link>
                  {userRole === 'vendor' && (
                    <Link 
                      to="/vendor/dashboard" 
                      className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Vendor Dashboard
                    </Link>
                  )}
                  {userRole === 'delivery_rider' && (
                    <Link 
                      to="/rider/dashboard" 
                      className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Truck className="h-4 w-4" />
                      Rider Dashboard
                    </Link>
                  )}
                  {userRole === 'reseller' && (
                    <Link 
                      to="/reseller/dashboard" 
                      className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Reseller Dashboard
                    </Link>
                  )}
                  {userRole === 'admin' && (
                    <Link 
                      to="/admin/dashboard" 
                      className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors flex items-center gap-2 text-left w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
