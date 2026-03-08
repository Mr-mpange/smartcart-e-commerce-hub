import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Star, MapPin, Package, Search, Verified, Store } from "lucide-react";
import { VendorRegistration } from "@/components/VendorRegistration";
import { RiderRegistration } from "@/components/RiderRegistration";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  is_approved: boolean;
}

const staticVendors = [
  {
    name: "TechGear Pro",
    logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200",
    banner: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600&h=200&fit=crop",
    rating: 4.8,
    reviews: 2456,
    products: 234,
    location: "Dar es Salaam",
    verified: true,
    categories: ["Electronics", "Accessories"],
  },
  {
    name: "Fashion Hub",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200",
    banner: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=200&fit=crop",
    rating: 4.7,
    reviews: 1823,
    products: 567,
    location: "Nairobi",
    verified: true,
    categories: ["Fashion", "Shoes"],
  },
  {
    name: "Home Essentials",
    logo: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=200",
    banner: "https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=600&h=200&fit=crop",
    rating: 4.6,
    reviews: 1234,
    products: 345,
    location: "Kampala",
    verified: true,
    categories: ["Home", "Garden"],
  },
  {
    name: "AudioTech",
    logo: "https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=200",
    banner: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=200&fit=crop",
    rating: 4.9,
    reviews: 3456,
    products: 156,
    location: "Mombasa",
    verified: true,
    categories: ["Audio", "Electronics"],
  },
  {
    name: "Sports Arena",
    logo: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200",
    banner: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&h=200&fit=crop",
    rating: 4.5,
    reviews: 987,
    products: 289,
    location: "Arusha",
    verified: false,
    categories: ["Sports", "Fitness"],
  },
  {
    name: "Book Haven",
    logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
    banner: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=200&fit=crop",
    rating: 4.7,
    reviews: 1567,
    products: 423,
    location: "Dodoma",
    verified: true,
    categories: ["Books", "Education"],
  },
];

const Vendors = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('is_approved', true);

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const filteredStaticVendors = staticVendors.filter(v => 
    v.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Header with Background */}
      <PageHeader
        title="Our Trusted Vendors"
        subtitle="Discover products from 500+ verified sellers across East Africa. Join our growing community of successful vendors."
        backgroundImage="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1920&h=600&fit=crop"
        overlay="gradient"
      >
        {userRole !== 'vendor' && userRole !== 'delivery_rider' && (
          <div className="flex gap-3 flex-wrap">
            <VendorRegistration />
            <RiderRegistration />
          </div>
        )}
        {userRole === 'vendor' && (
          <Button variant="secondary" onClick={() => navigate('/vendor/dashboard')}>
            <Store className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        )}
      </PageHeader>

      <div className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8 max-w-2xl -mt-6 relative z-10">
          <div className="relative bg-background rounded-lg shadow-lg p-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors by name..."
              className="pl-12 h-12 text-lg border-0 focus-visible:ring-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{staticVendors.length + vendors.length}</div>
              <div className="text-sm text-muted-foreground">Total Vendors</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">{staticVendors.filter(v => v.verified).length + vendors.length}</div>
              <div className="text-sm text-muted-foreground">Verified</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">15K+</div>
              <div className="text-sm text-muted-foreground">Products</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">4.7</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </CardContent>
          </Card>
        </div>

        {/* Database Vendors */}
        {vendors.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">New Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-lg transition-all overflow-hidden">
                  <div className="h-24 bg-gradient-primary relative">
                    <div className="absolute inset-0 bg-black/20" />
                  </div>
                  <CardContent className="p-6 -mt-10 relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-lg bg-background border-4 border-background shadow-lg flex items-center justify-center">
                        <Store className="h-8 w-8 text-primary" />
                      </div>
                      <div className="flex-1 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{vendor.business_name}</h3>
                          <Verified className="h-5 w-5 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {vendor.business_description || 'New vendor on SmartCart'}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full" variant="outline">
                      View Store
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Featured Vendors */}
        <h2 className="text-2xl font-bold mb-6">Featured Vendors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStaticVendors.map((vendor, index) => (
            <Card key={index} className="hover:shadow-xl transition-all overflow-hidden group">
              {/* Vendor Banner */}
              <div className="relative h-28 overflow-hidden">
                <img
                  src={vendor.banner}
                  alt={vendor.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {vendor.verified && (
                  <Badge className="absolute top-3 right-3 bg-primary">Verified</Badge>
                )}
              </div>
              
              <CardContent className="p-6 -mt-8 relative">
                {/* Logo & Info */}
                <div className="flex items-end gap-4 mb-4">
                  <img
                    src={vendor.logo}
                    alt={vendor.name}
                    className="w-16 h-16 rounded-xl object-cover border-4 border-background shadow-lg"
                  />
                  <div className="flex-1 pb-1">
                    <h3 className="font-semibold text-lg">{vendor.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {vendor.location}
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="flex gap-2 mb-4">
                  {vendor.categories.map((cat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {cat}
                    </Badge>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-t border-b">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{vendor.rating}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{vendor.reviews} reviews</div>
                  </div>
                  <div className="text-center border-x">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Package className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{vendor.products}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Products</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold mb-1">
                      {vendor.verified ? <Verified className="h-5 w-5 text-primary mx-auto" /> : "○"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vendor.verified ? "Verified" : "Pending"}
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  Visit Store
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Vendors;
