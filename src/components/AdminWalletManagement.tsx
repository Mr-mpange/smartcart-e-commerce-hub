import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Wallet, Shield, TrendingUp, Users } from "lucide-react";

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  profile_name: string;
  role: string;
}

interface EscrowRow {
  id: string;
  order_id: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  buyer_name: string;
  vendor_name: string;
}

export function AdminWalletManagement() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [escrows, setEscrows] = useState<EscrowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCommission, setTotalCommission] = useState(0);
  const [totalEscrowHeld, setTotalEscrowHeld] = useState(0);
  const [totalPlatformBalance, setTotalPlatformBalance] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all wallets
      const { data: walletsData, error: walletsError } = await supabase
        .from("wallets")
        .select("id, user_id, balance, currency")
        .order("balance", { ascending: false });
      if (walletsError) throw walletsError;

      // Fetch profiles and roles for wallet owners
      const userIds = (walletsData || []).map((w) => w.user_id);
      let profilesMap = new Map<string, string>();
      let rolesMap = new Map<string, string>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profilesMap = new Map(profiles?.map((p) => [p.id, p.full_name]) || []);

        const { data: roles } = await supabase
          .from("user_roles")
          .select("user_id, role")
          .in("user_id", userIds);
        rolesMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);
      }

      const enrichedWallets: WalletRow[] = (walletsData || []).map((w) => ({
        ...w,
        profile_name: profilesMap.get(w.user_id) || "Unknown",
        role: rolesMap.get(w.user_id) || "customer",
      }));
      setWallets(enrichedWallets);
      setTotalPlatformBalance(enrichedWallets.reduce((sum, w) => sum + w.balance, 0));

      // Fetch escrows
      const { data: escrowsData, error: escrowsError } = await supabase
        .from("escrows")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (escrowsError) throw escrowsError;

      // Get buyer/vendor names for escrows
      const escrowUserIds = new Set<string>();
      (escrowsData || []).forEach((e) => {
        escrowUserIds.add(e.buyer_id);
        escrowUserIds.add(e.vendor_id);
      });
      let escrowProfilesMap = new Map<string, string>();
      if (escrowUserIds.size > 0) {
        const { data: escrowProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", Array.from(escrowUserIds));
        escrowProfilesMap = new Map(escrowProfiles?.map((p) => [p.id, p.full_name]) || []);
      }

      const enrichedEscrows: EscrowRow[] = (escrowsData || []).map((e) => ({
        id: e.id,
        order_id: e.order_id,
        amount: e.amount,
        commission_amount: e.commission_amount,
        status: e.status,
        created_at: e.created_at,
        buyer_name: escrowProfilesMap.get(e.buyer_id) || "Unknown",
        vendor_name: escrowProfilesMap.get(e.vendor_id) || "Unknown",
      }));
      setEscrows(enrichedEscrows);

      setTotalEscrowHeld(enrichedEscrows.filter((e) => e.status === "held").reduce((s, e) => s + e.amount, 0));
      setTotalCommission(enrichedEscrows.filter((e) => e.status === "released").reduce((s, e) => s + e.commission_amount, 0));
    } catch (err: any) {
      console.error("Admin wallet error:", err);
      toast.error("Failed to load wallet data");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      admin: "destructive",
      vendor: "default",
      customer: "secondary",
      delivery_rider: "outline",
    };
    return <Badge variant={variants[role] || "outline"} className="capitalize">{role.replace("_", " ")}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      held: "outline",
      released: "default",
      refunded: "secondary",
      disputed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"} className="capitalize">{status}</Badge>;
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
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Wallet className="h-8 w-8 text-primary" />
            <div>
              <p className="text-xl font-bold">TSh {totalPlatformBalance.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Platform Balance</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-xl font-bold">TSh {totalEscrowHeld.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Held in Escrow</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-xl font-bold">TSh {totalCommission.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Commission Earned</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-xl font-bold">{wallets.length}</p>
              <p className="text-xs text-muted-foreground">Active Wallets</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Wallets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Wallets</CardTitle>
          <CardDescription>Platform wallet balances by user</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.profile_name}</TableCell>
                  <TableCell>{getRoleBadge(w.role)}</TableCell>
                  <TableCell className="text-right font-semibold">
                    TSh {w.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Escrow History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escrow History</CardTitle>
          <CardDescription>All escrow transactions across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {escrows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No escrows yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead className="hidden md:table-cell">Buyer</TableHead>
                  <TableHead className="hidden md:table-cell">Vendor</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {escrows.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">#{e.order_id.slice(0, 8).toUpperCase()}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.buyer_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{e.vendor_name}</TableCell>
                    <TableCell className="text-right font-semibold">TSh {e.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-right hidden md:table-cell">TSh {e.commission_amount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(e.status)}</TableCell>
                    <TableCell className="hidden md:table-cell">{new Date(e.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
