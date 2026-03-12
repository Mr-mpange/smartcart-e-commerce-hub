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

export async function sendOTPSMS(
  email: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('briq-sms', {
      body: {
        action: 'generate_otp',
        email: email,
      },
    });

    if (error) {
      console.error('OTP SMS error:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: data?.success || false, 
      error: data?.error,
      message: data?.message 
    };
  } catch (err: any) {
    console.error('Failed to send OTP SMS:', err);
    return { success: false, error: err.message };
  }
}

export async function verifyOTPSMS(
  email: string,
  otpCode: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('briq-sms', {
      body: {
        action: 'verify_otp',
        email: email,
        otp_code: otpCode,
      },
    });

    if (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: error.message };
    }

    return { 
      success: data?.success || false, 
      error: data?.error,
      message: data?.message 
    };
  } catch (err: any) {
    console.error('Failed to verify OTP:', err);
    return { success: false, error: err.message };
  }
}
