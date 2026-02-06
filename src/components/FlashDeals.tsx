import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const flashDeals = [
  {
    name: "Wireless Earbuds Pro",
    price: 49999,
    originalPrice: 129999,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop",
    sold: 234,
    stock: 50
  },
  {
    name: "Smart Watch Series X",
    price: 159999,
    originalPrice: 299999,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=300&h=300&fit=crop",
    sold: 189,
    stock: 30
  },
  {
    name: "Portable Power Bank 20000mAh",
    price: 29999,
    originalPrice: 79999,
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=300&h=300&fit=crop",
    sold: 567,
    stock: 100
  },
  {
    name: "Bluetooth Speaker Mini",
    price: 19999,
    originalPrice: 49999,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop",
    sold: 892,
    stock: 75
  },
  {
    name: "USB-C Hub 7-in-1",
    price: 39999,
    originalPrice: 89999,
    image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=300&h=300&fit=crop",
    sold: 156,
    stock: 40
  },
  {
    name: "Mechanical Keyboard",
    price: 89999,
    originalPrice: 179999,
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=300&h=300&fit=crop",
    sold: 445,
    stock: 60
  }
];

export const FlashDeals = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 32, seconds: 47 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
        }
        if (minutes < 0) {
          minutes = 59;
          hours--;
        }
        if (hours < 0) {
          hours = 23;
          minutes = 59;
          seconds = 59;
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-12 bg-gradient-to-r from-destructive to-orange-600">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-full">
              <Zap className="h-8 w-8 text-destructive-foreground" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-destructive-foreground">Flash Deals</h2>
              <p className="text-destructive-foreground/80">Limited time offers - Don't miss out!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-destructive-foreground">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Ends in:</span>
              <div className="flex gap-1">
                <span className="bg-background/20 px-3 py-1 rounded font-mono font-bold">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-background/20 px-3 py-1 rounded font-mono font-bold">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="font-bold">:</span>
                <span className="bg-background/20 px-3 py-1 rounded font-mono font-bold">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>
            <Button 
              variant="secondary" 
              className="hidden md:flex"
              onClick={() => navigate('/deals')}
            >
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {flashDeals.map((deal, index) => {
            const discount = Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100);
            const soldPercentage = Math.round((deal.sold / (deal.sold + deal.stock)) * 100);
            
            return (
              <Card 
                key={index} 
                className="bg-white overflow-hidden cursor-pointer hover:shadow-xl transition-all group"
                onClick={() => navigate('/products')}
              >
                <div className="relative">
                  <img
                    src={deal.image}
                    alt={deal.name}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                  />
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    -{discount}%
                  </Badge>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2 h-10">{deal.name}</h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-red-600">
                        TSh {deal.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-through">
                      TSh {deal.originalPrice.toLocaleString()}
                    </p>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                        style={{ width: `${soldPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{deal.sold} sold</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Button 
            variant="secondary"
            onClick={() => navigate('/deals')}
          >
            View All Deals <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};
