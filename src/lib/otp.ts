// Temporary OTP simulation until Edge Function is deployed
// This should be replaced with actual Briq SMS integration

interface OTPStore {
  [email: string]: {
    otp: string;
    expires: number;
    phone: string;
  };
}

// In-memory OTP store (for development only)
const otpStore: OTPStore = {};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  } else if (!cleaned.startsWith('255') && cleaned.length === 9) {
    cleaned = '255' + cleaned;
  }
  return '+' + cleaned;
};

export const sendOTP = async (email: string, phone: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    // Store OTP
    otpStore[email] = {
      otp,
      expires,
      phone: formatPhoneNumber(phone),
    };
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // In development, log the OTP to console
    console.log(`🔐 OTP for ${email} (${formattedPhone}): ${otp}`);
    
    // Show toast notification with OTP for development
    if (typeof window !== 'undefined') {
      // Create a prominent notification element
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #1f2937;
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-family: monospace;
        font-size: 18px;
        z-index: 10000;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        border: 2px solid #3b82f6;
        text-align: center;
        min-width: 300px;
      `;
      notification.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 14px; color: #93c5fd;">SMS Service Unavailable - Development Mode</div>
        <div style="font-size: 24px; font-weight: bold; color: #60a5fa; margin: 10px 0;">OTP: ${otp}</div>
        <div style="font-size: 12px; color: #9ca3af;">Phone: ${formattedPhone}</div>
        <div style="font-size: 12px; color: #9ca3af; margin-top: 10px;">This notification will close in 15 seconds</div>
      `;
      document.body.appendChild(notification);
      
      // Remove after 15 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 15000);
      
      // Also create a smaller persistent notification
      const persistentNotif = document.createElement('div');
      persistentNotif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #059669;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
      `;
      persistentNotif.innerHTML = `🔐 OTP: <strong>${otp}</strong> (Click to dismiss)`;
      persistentNotif.onclick = () => persistentNotif.remove();
      document.body.appendChild(persistentNotif);
    }
    
    return {
      success: true,
      message: `Verification code generated for ${formattedPhone} (Development Mode)`,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to generate verification code',
    };
  }
};

export const verifyOTP = async (email: string, otpCode: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  try {
    const stored = otpStore[email];
    
    if (!stored) {
      return {
        success: false,
        error: 'No OTP found for this email',
      };
    }
    
    if (Date.now() > stored.expires) {
      delete otpStore[email];
      return {
        success: false,
        error: 'OTP has expired',
      };
    }
    
    if (stored.otp !== otpCode) {
      return {
        success: false,
        error: 'Invalid OTP',
      };
    }
    
    // OTP is valid, clean up
    delete otpStore[email];
    
    return {
      success: true,
      message: 'OTP verified successfully',
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to verify OTP',
    };
  }
};