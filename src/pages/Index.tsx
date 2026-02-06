import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { PromoBanners } from "@/components/PromoBanners";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FlashDeals } from "@/components/FlashDeals";
import { TrendingProducts } from "@/components/TrendingProducts";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { TopVendors } from "@/components/TopVendors";
import { Features } from "@/components/Features";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
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
