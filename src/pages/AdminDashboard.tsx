import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminRevenueAnalytics } from "@/components/AdminRevenueAnalytics";
import { AdminOrderManagement } from "@/components/AdminOrderManagement";
import { AdminWalletManagement } from "@/components/AdminWalletManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Shield, Users, Store, Package, CheckCircle2, XCircle,
  Clock, Loader2, ShoppingCart, Truck,
} from "lucide-react";

interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  is_approved: boolean;
  created_at: string;
  profile?: { full_name: string; phone: string | null };
}

interface RiderProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  vehicle_type: string;
  license_number: string | null;
  area_of_operation: string | null;
  is_approved: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalVendors: number;
  totalProducts: number;
  totalOrders: number;
  totalRiders: number;
}

const AdminDashboard = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalVendors: 0, totalProducts: 0, totalOrders: 0, totalRiders: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (userRole !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/");
      return;
    }
    fetchData();
  }, [userRole]);

  const fetchData = async () => {
    try {
      const [vendorsRes, ridersRes, profilesRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("vendor_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("rider_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);

      const vendorData = vendorsRes.data || [];
      const riderData = ridersRes.data || [];
      const userIds = vendorData.map((v) => v.user_id);

      let profilesMap = new Map<string, { full_name: string; phone: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone")
          .in("id", userIds);
        profilesMap = new Map(profiles?.map((p) => [p.id, { full_name: p.full_name, phone: p.phone }]) || []);
      }

      setVendors(vendorData.map((v) => ({ ...v, profile: profilesMap.get(v.user_id) })));
      setRiders(riderData as RiderProfile[]);
      setStats({
        totalUsers: profilesRes.count || 0,
        totalVendors: vendorData.length,
        totalProducts: productsRes.count || 0,
        totalOrders: ordersRes.count || 0,
        totalRiders: riderData.length,
      });
    } catch (error) {
      console.error("Error fetching admin data:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (vendorId: string, approve: boolean) => {
    setActionLoading(vendorId);
    try {
      const { error } = await supabase
        .from("vendor_profiles")
        .update({ is_approved: approve })
        .eq("id", vendorId);

      if (error) throw error;
      toast.success(approve ? "Vendor approved!" : "Vendor rejected.");
      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, is_approved: approve } : v))
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update vendor");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRiderApproval = async (riderId: string, approve: boolean) => {
    setActionLoading(riderId);
    try {
      const { error } = await supabase
        .from("rider_profiles")
        .update({ is_approved: approve })
        .eq("id", riderId);

      if (error) throw error;
      toast.success(approve ? "Rider approved!" : "Rider rejected.");
      setRiders((prev) =>
        prev.map((r) => (r.id === riderId ? { ...r, is_approved: approve } : r))
      );
    } catch (error: any) {
      toast.error(error.message || "Failed to update rider");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const pendingVendors = vendors.filter((v) => !v.is_approved);
  const approvedVendors = vendors.filter((v) => v.is_approved);

  const renderOverview = () => (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
          { label: "Vendors", value: stats.totalVendors, icon: Store, color: "text-primary" },
          { label: "Products", value: stats.totalProducts, icon: Package, color: "text-orange-500" },
          { label: "Orders", value: stats.totalOrders, icon: ShoppingCart, color: "text-purple-500" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <AdminRevenueAnalytics />
    </>
  );

  const renderVendors = () => {
    const renderTable = (list: VendorProfile[], tab: string) => (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{tab} Vendors</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No vendors found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead className="hidden md:table-cell">Owner</TableHead>
                  <TableHead className="hidden md:table-cell">Registered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{vendor.business_name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {vendor.business_description || "No description"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {vendor.profile?.full_name || "Unknown"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.is_approved ? "default" : "outline"}>
                        {vendor.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!vendor.is_approved ? (
                        <Button
                          size="sm"
                          onClick={() => handleApproval(vendor.id, true)}
                          disabled={actionLoading === vendor.id}
                        >
                          {actionLoading === vendor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                          )}
                          Approve
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleApproval(vendor.id, false)}
                          disabled={actionLoading === vendor.id}
                        >
                          {actionLoading === vendor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-1" />
                          )}
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    );

    return (
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending ({pendingVendors.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Approved ({approvedVendors.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Store className="h-4 w-4" /> All ({vendors.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderTable(pendingVendors, "pending")}</TabsContent>
        <TabsContent value="approved">{renderTable(approvedVendors, "approved")}</TabsContent>
        <TabsContent value="all">{renderTable(vendors, "all")}</TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <SidebarProvider>
        <div className="flex-1 flex w-full">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center border-b px-4">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-lg font-semibold capitalize">{activeTab}</h1>
            </header>
            <div className="flex-1 p-4 md:p-8 overflow-auto">
              {activeTab === "overview" && renderOverview()}
              {activeTab === "orders" && <AdminOrderManagement />}
              {activeTab === "vendors" && renderVendors()}
              {activeTab === "wallets" && <AdminWalletManagement />}
              {activeTab === "analytics" && <AdminRevenueAnalytics />}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
