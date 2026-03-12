import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminRevenueAnalytics } from "@/components/AdminRevenueAnalytics";
import { AdminOrderManagement } from "@/components/AdminOrderManagement";
import { AdminWalletManagement } from "@/components/AdminWalletManagement";
import { PaymentMonitoring } from "@/components/PaymentMonitoring";
import { PayoutManagement } from "@/components/PayoutManagement";
import { FinancialLedger } from "@/components/FinancialLedger";
import { PaymentAnalytics } from "@/components/PaymentAnalytics";
import { AdminUserManagement } from "@/components/AdminUserManagement";
import { VendorDocumentUpload } from "@/components/VendorDocumentUpload";
import { DatabaseCleanup } from "@/components/DatabaseCleanup";
import { AdminProfile } from "@/components/AdminProfile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Users, Store, Package, CheckCircle2, XCircle,
  Clock, Loader2, ShoppingCart, Truck, Plus, FileText, Trash2, User,
} from "lucide-react";

interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string | null;
  is_approved: boolean;
  documents_verified: boolean;
  verification_notes: string | null;
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
  const { user, loading: authLoading } = useAuth();
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalVendors: 0, totalProducts: 0, totalOrders: 0, totalRiders: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [createVendorOpen, setCreateVendorOpen] = useState(false);
  const [newVendorData, setNewVendorData] = useState({
    email: '',
    fullName: '',
    businessName: '',
    businessDescription: '',
  });

  const [adminProfile, setAdminProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    // Since ProtectedRoute handles authentication, we can directly fetch data
    fetchData();
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    if (!user?.id) return;
    
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setAdminProfile(profile);
    } catch (error) {
      console.error('Error fetching admin profile:', error);
    }
  };

  const fetchData = async () => {
    try {
      console.log('Fetching admin data...');
      
      // Check current user and roles
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current user:', currentUser?.id);
      
      if (currentUser) {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', currentUser.id);
        console.log('Current user roles:', userRoles);
      }

      const [vendorsRes, ridersRes, profilesRes, productsRes, ordersRes] = await Promise.all([
        supabase.from("vendor_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("rider_profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
      ]);

      console.log('Vendors response:', vendorsRes);
      console.log('Vendors data:', vendorsRes.data);
      console.log('Vendors error:', vendorsRes.error);

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

      setVendors(vendorData.map((v) => ({ 
        ...v, 
        profile: profilesMap.get(v.user_id),
        documents_verified: (v as any).documents_verified || false,
        verification_notes: (v as any).verification_notes || null,
      })));
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

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create-vendor');
    
    try {
      console.log('Creating vendor with data:', newVendorData);
      
      // Get current admin user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        throw new Error('Admin user not found');
      }
      
      // Create vendor profile using admin's user_id but mark it as admin-created
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendor_profiles')
        .insert([{
          user_id: currentUser.id, // Use admin's user_id
          business_name: newVendorData.businessName,
          business_description: `${newVendorData.businessDescription || ''}\n[ADMIN_CREATED - Contact: ${newVendorData.email} - Owner: ${newVendorData.fullName}]`,
          is_approved: true, // Admin-created vendors are auto-approved
        }])
        .select()
        .single();

      if (vendorError) {
        console.error('Vendor creation error:', vendorError);
        throw vendorError;
      }

      toast.success(`Vendor "${newVendorData.businessName}" created successfully! Contact: ${newVendorData.email}`);
      setCreateVendorOpen(false);
      setNewVendorData({
        email: '',
        fullName: '',
        businessName: '',
        businessDescription: '',
      });
      fetchData();
    } catch (error: any) {
      console.error('Create vendor error:', error);
      toast.error(error.message || 'Failed to create vendor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteVendor = async (vendorId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${businessName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(vendorId);
    try {
      console.log('Deleting vendor:', vendorId, businessName);
      
      // Get vendor profile to check if it's admin-created
      const { data: vendorProfile, error: fetchError } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_description')
        .eq('id', vendorId)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw new Error('Failed to fetch vendor profile');
      }

      if (!vendorProfile) {
        throw new Error('Vendor not found');
      }

      const isAdminCreated = vendorProfile.business_description?.includes('[ADMIN_CREATED');

      // Delete vendor profile first (this will cascade delete related data)
      const { error: profileError } = await supabase
        .from('vendor_profiles')
        .delete()
        .eq('id', vendorId);

      if (profileError) {
        console.error('Profile delete error:', profileError);
        throw profileError;
      }

      // Only delete user-related data if this is not an admin-created vendor
      if (vendorProfile.user_id && !isAdminCreated) {
        // Delete user roles
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', vendorProfile.user_id);

        if (roleError) {
          console.warn('Failed to delete user roles:', roleError);
        }

        // Delete user profile
        const { error: userError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', vendorProfile.user_id);

        if (userError) {
          console.warn('Failed to delete user profile:', userError);
        }
      }

      toast.success('Vendor deleted successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Delete vendor error:', error);
      toast.error(error.message || 'Failed to delete vendor');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="capitalize">{tab} Vendors</CardTitle>
          </div>
          <Dialog open={createVendorOpen} onOpenChange={setCreateVendorOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Vendor</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-fullname">Full Name *</Label>
                  <Input
                    id="vendor-fullname"
                    value={newVendorData.fullName}
                    onChange={(e) => setNewVendorData({ ...newVendorData, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-email">Contact Email</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    value={newVendorData.email}
                    onChange={(e) => setNewVendorData({ ...newVendorData, email: e.target.value })}
                    placeholder="Vendor's contact email"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This email will be used for contact purposes. The vendor will need to register separately.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-business">Business Name *</Label>
                  <Input
                    id="vendor-business"
                    value={newVendorData.businessName}
                    onChange={(e) => setNewVendorData({ ...newVendorData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-desc">Business Description</Label>
                  <Textarea
                    id="vendor-desc"
                    value={newVendorData.businessDescription}
                    onChange={(e) => setNewVendorData({ ...newVendorData, businessDescription: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={actionLoading === 'create-vendor'}>
                  {actionLoading === 'create-vendor' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Vendor'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
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
                      {vendor.business_description?.includes('[ADMIN_CREATED') 
                        ? 'Admin Created' 
                        : (vendor.profile?.full_name || "Unknown")
                      }
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant={vendor.is_approved ? "default" : "outline"}>
                          {vendor.is_approved ? "Approved" : "Pending"}
                        </Badge>
                        {vendor.documents_verified && (
                          <Badge variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            Docs Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Docs
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Vendor Documents - {vendor.business_name}</DialogTitle>
                            </DialogHeader>
                            <VendorDocumentUpload vendorId={vendor.id} readonly />
                          </DialogContent>
                        </Dialog>
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.business_name)}
                          disabled={actionLoading === vendor.id}
                        >
                          {actionLoading === vendor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
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

  const pendingRiders = riders.filter((r) => !r.is_approved);
  const approvedRiders = riders.filter((r) => r.is_approved);

  const renderRiders = () => {
    const renderRiderTable = (list: RiderProfile[], tab: string) => (
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{tab} Riders</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No riders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="hidden md:table-cell">Vehicle</TableHead>
                  <TableHead className="hidden md:table-cell">Area</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rider.full_name}</p>
                        {rider.license_number && (
                          <p className="text-xs text-muted-foreground">License: {rider.license_number}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{rider.phone}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{rider.vehicle_type}</TableCell>
                    <TableCell className="hidden md:table-cell">{rider.area_of_operation || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={rider.is_approved ? "default" : "outline"}>
                        {rider.is_approved ? "Approved" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!rider.is_approved ? (
                        <Button
                          size="sm"
                          onClick={() => handleRiderApproval(rider.id, true)}
                          disabled={actionLoading === rider.id}
                        >
                          {actionLoading === rider.id ? (
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
                          onClick={() => handleRiderApproval(rider.id, false)}
                          disabled={actionLoading === rider.id}
                        >
                          {actionLoading === rider.id ? (
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
            <Clock className="h-4 w-4" /> Pending ({pendingRiders.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle2 className="h-4 w-4" /> Approved ({approvedRiders.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Truck className="h-4 w-4" /> All ({riders.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending">{renderRiderTable(pendingRiders, "pending")}</TabsContent>
        <TabsContent value="approved">{renderRiderTable(approvedRiders, "approved")}</TabsContent>
        <TabsContent value="all">{renderRiderTable(riders, "all")}</TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SidebarProvider>
        <div className="flex-1 flex w-full">
          <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center justify-between border-b px-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-lg font-semibold capitalize">{activeTab}</h1>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {adminProfile?.full_name || user?.email?.split('@')[0] || 'Admin'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('profile')}
                  title="Profile"
                >
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </header>
            <div className="flex-1 p-4 md:p-8 overflow-auto">
              {activeTab === "overview" && renderOverview()}
              {activeTab === "users" && <AdminUserManagement />}
              {activeTab === "orders" && <AdminOrderManagement />}
              {activeTab === "vendors" && renderVendors()}
              {activeTab === "riders" && renderRiders()}
              {activeTab === "wallets" && <AdminWalletManagement />}
              {activeTab === "payments" && <PaymentMonitoring />}
              {activeTab === "payouts" && <PayoutManagement />}
              {activeTab === "ledger" && <FinancialLedger />}
              {activeTab === "payment-analytics" && <PaymentAnalytics />}
              {activeTab === "analytics" && <AdminRevenueAnalytics />}
              {activeTab === "cleanup" && <DatabaseCleanup />}
              {activeTab === "profile" && <AdminProfile />}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AdminDashboard;
