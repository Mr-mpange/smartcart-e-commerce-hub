// Shared types for Supabase Edge Functions

export interface CorsHeaders {
  [key: string]: string;
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Headers': string;
}

export interface OTPRequest {
  action: 'generate' | 'verify';
  email?: string;
  phone_number?: string;
  otp_code?: string;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  error?: string;
  expires_in?: number;
  phone_number?: string;
}

// Deno global types
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}