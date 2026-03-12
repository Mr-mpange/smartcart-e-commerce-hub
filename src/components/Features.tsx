import { Truck, Shield, CreditCard, Headphones } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free shipping on orders over $50. Get your products delivered to your doorstep quickly."
  },
  {
    icon: Shield,
    title: "Secure Shopping",
    description: "Your transactions are protected with bank-level security and encryption."
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Multiple payment options including mobile money, cards, and cash on delivery."
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our customer service team is always here to help you with any questions."
  }
];

export const Features = () => {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
