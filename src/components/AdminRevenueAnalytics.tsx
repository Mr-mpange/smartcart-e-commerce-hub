import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";

const CHART_COLORS = [
  "hsl(142, 76%, 36%)",
  "hsl(200, 80%, 50%)",
  "hsl(35, 92%, 55%)",
  "hsl(280, 65%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(170, 70%, 45%)",
];

interface SalesTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
}

interface VendorRevenue {
  name: string;
  revenue: number;
}

export const AdminRevenueAnalytics = () => {
  const [salesTrends, setSalesTrends] = useState<SalesTrend[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryData[]>([]);
  const [topVendors, setTopVendors] = useState<VendorRevenue[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all orders with items
      const { data: orders } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status")
        .in("status", ["confirmed", "processing", "shipped", "delivered"])
        .order("created_at", { ascending: true });

      const { data: orderItems } = await supabase
        .from("order_items")
        .select("order_id, price, quantity, vendor_id, product_id");

      const { data: products } = await supabase
        .from("products")
        .select("id, category, vendor_id");

      const { data: vendorProfiles } = await supabase
        .from("vendor_profiles")
        .select("user_id, business_name");

      // Sales trends (last 30 days grouped by day)
      const trendMap = new Map<string, { revenue: number; orders: number }>();
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        trendMap.set(key, { revenue: 0, orders: 0 });
      }

      (orders || []).forEach((o) => {
        const key = o.created_at.split("T")[0];
        const existing = trendMap.get(key);
        if (existing) {
          existing.revenue += Number(o.total_amount);
          existing.orders += 1;
        }
      });

      setSalesTrends(
        Array.from(trendMap.entries()).map(([date, data]) => ({
          date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
          ...data,
        }))
      );

      // Total revenue
      const rev = (orders || []).reduce((s, o) => s + Number(o.total_amount), 0);
      setTotalRevenue(rev);

      // Category breakdown
      const catMap = new Map<string, number>();
      const productMap = new Map<string, string>();
      (products || []).forEach((p) => productMap.set(p.id, p.category));

      (orderItems || []).forEach((item) => {
        const cat = productMap.get(item.product_id || "") || "Other";
        catMap.set(cat, (catMap.get(cat) || 0) + Number(item.price) * item.quantity);
      });

      setCategoryBreakdown(
        Array.from(catMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
      );

      // Top vendors
      const vendorMap = new Map<string, number>();
      (orderItems || []).forEach((item) => {
        vendorMap.set(item.vendor_id, (vendorMap.get(item.vendor_id) || 0) + Number(item.price) * item.quantity);
      });

      const vendorNameMap = new Map<string, string>();
      (vendorProfiles || []).forEach((v) => vendorNameMap.set(v.user_id, v.business_name));

      setTopVendors(
        Array.from(vendorMap.entries())
          .map(([id, revenue]) => ({ name: vendorNameMap.get(id) || "Unknown", revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5)
      );
    } catch (error) {
      console.error("Analytics error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Revenue header */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold">TSh {totalRevenue.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sales trend line chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
          <CardDescription>Daily revenue and order count</CardDescription>
        </CardHeader>
        <CardContent>
          {salesTrends.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No sales data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesTrends}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: number) => [`TSh ${value.toLocaleString()}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown pie */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
            <CardDescription>Product category performance</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No category data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `TSh ${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top vendors bar chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
            <CardDescription>By total revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topVendors.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No vendor data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVendors} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip formatter={(value: number) => `TSh ${value.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
