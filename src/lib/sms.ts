import { supabase } from "@/integrations/supabase/client";

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export async function sendOrderStatusSMS(
  orderId: string, 
  status: OrderStatus,
  phoneNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('briq-sms', {
      body: {
        order_id: orderId,
        status: status,
        phone_number: phoneNumber,
      },
    });

    if (error) {
      console.error('SMS notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (err: any) {
    console.error('Failed to send SMS:', err);
    return { success: false, error: err.message };
  }
}

export async function sendDirectSMS(
  phoneNumber: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('briq-sms', {
      body: {
        phone_number: phoneNumber,
        message: message,
      },
    });

    if (error) {
      console.error('SMS error:', error);
      return { success: false, error: error.message };
    }

    return { success: data?.success || false, error: data?.error };
  } catch (err: any) {
    console.error('Failed to send SMS:', err);
    return { success: false, error: err.message };
  }
}
