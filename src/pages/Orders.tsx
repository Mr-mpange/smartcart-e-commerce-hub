import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Clock, CheckCircle2, XCircle } from "lucide-react";

const Orders = () => {
  // Mock orders - replace with actual data from backend
  const orders = [
    {
      id: "ORD-001",
      date: "2024-01-15",
      total: 105000,
      status: "delivered",
      items: 2,
    },
    {
      id: "ORD-002",
      date: "2024-01-20",
      total: 75000,
      status: "processing",
      items: 1,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-4 w-4" />;
      case "processing":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "delivered":
        return "default";
      case "processing":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 flex items-center gap-2">
            <Package className="h-8 w-8" />
            My Orders
          </h1>

          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg text-muted-foreground">No orders yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg md:text-xl">
                          Order {order.id}
                        </CardTitle>
                        <CardDescription>
                          Placed on {new Date(order.date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={getStatusVariant(order.status)}
                        className="w-fit flex items-center gap-1"
                      >
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status}</span>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-sm">
                      <div className="space-y-1">
                        <p className="text-muted-foreground">
                          {order.items} {order.items === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-lg md:text-xl font-bold text-primary">
                          TZS {order.total.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
