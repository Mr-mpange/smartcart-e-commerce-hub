import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { AutoScrollProducts } from "@/components/AutoScrollProducts";
import { PromoBanners } from "@/components/PromoBanners";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FlashDeals } from "@/components/FlashDeals";
import { TrendingProducts } from "@/components/TrendingProducts";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { TopVendors } from "@/components/TopVendors";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/role-routing";

const Index = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && userRole && userRole !== "customer") {
      navigate(getDashboardRoute(userRole), { replace: true });
    }
  }, [loading, user, userRole, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <AutoScrollProducts />
      <PromoBanners />
      <CategoryGrid />
      <FlashDeals />
      <TrendingProducts />
      <FeaturedProducts />
      <TopVendors />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
