import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Clock, Gift } from "lucide-react";

const banners = [
  {
    title: "Flash Sale",
    subtitle: "Up to 70% OFF",
    description: "Limited time deals on electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop",
    gradient: "from-orange-500 to-red-600",
    badge: "FLASH",
    icon: Zap,
    link: "/deals"
  },
  {
    title: "New Arrivals",
    subtitle: "Fresh Styles",
    description: "Latest fashion collection 2024",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    gradient: "from-purple-500 to-pink-600",
    badge: "NEW",
    icon: Gift,
    link: "/products?category=Fashion"
  },
  {
    title: "Daily Deals",
    subtitle: "Save Big",
    description: "Exclusive offers every day",
    image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&h=400&fit=crop",
    gradient: "from-emerald-500 to-teal-600",
    badge: "DAILY",
    icon: Clock,
    link: "/deals"
  }
];

export const PromoBanners = () => {
  const navigate = useNavigate();

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {banners.map((banner, index) => {
            const Icon = banner.icon;
            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl cursor-pointer group h-48"
                onClick={() => navigate(banner.link)}
              >
                <img
                  src={banner.image}
                  alt={banner.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient} opacity-80`} />
                <div className="absolute inset-0 p-6 flex flex-col justify-between text-white">
                  <div>
                    <Badge className="bg-white/20 border-0 mb-2">
                      <Icon className="h-3 w-3 mr-1" />
                      {banner.badge}
                    </Badge>
                    <h3 className="text-2xl font-bold">{banner.title}</h3>
                    <p className="text-xl font-semibold opacity-90">{banner.subtitle}</p>
                  </div>
                  <p className="text-sm opacity-80">{banner.description}</p>
                </div>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" className="rounded-full">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
