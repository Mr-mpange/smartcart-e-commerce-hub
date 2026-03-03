import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const statusLabels: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Payment Confirmed",
  processing: "Being Processed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export function useOrderNotifications() {
  const { user, userRole } = useAuth();

  useEffect(() => {
    if (!user) return;

    requestNotificationPermission();

    // Subscribe to order updates for this user (customer) or all orders (vendor/admin)
    const filter =
      userRole === "admin"
        ? undefined
        : userRole === "vendor"
        ? undefined // vendors will filter client-side via order_items
        : `user_id=eq.${user.id}`;

    const channelConfig: any = {
      event: "UPDATE",
      schema: "public",
      table: "orders",
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel("order-notifications")
    .on("postgres_changes", channelConfig, (payload) => {
        const newData = payload.new as Record<string, any>;
        const newStatus = newData.status as string;
        const orderId = (newData.id as string).slice(0, 8).toUpperCase();
        const label = statusLabels[newStatus] || newStatus;

        const title = `Order #${orderId}`;
        const body = `Status updated to: ${label}`;

        // In-app toast
        toast.info(body, { description: title });

        // Browser push notification
        showBrowserNotification(title, body);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);
}
