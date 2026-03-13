import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ShoppingCart, Store, User } from 'lucide-react';
import { sendOTP, verifyOTP } from '@/lib/otp';
import { sendOTPSMS, verifyOTPSMS } from '@/lib/sms';

// Phone number formatting utility
const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  } else if (!cleaned.startsWith('255') && cleaned.length === 9) {
    cleaned = '255' + cleaned;
  }
  return '+' + cleaned;
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [userType, setUserType] = useState<'customer' | 'vendor'>('customer');
  const [businessName, setBusinessName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const [isOtpFlow, setIsOtpFlow] = useState(false);
  const { signIn, signUp, user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Restore OTP flow state on mount
  useEffect(() => {
    const isInOtpFlow = localStorage.getItem('otp_flow_active') === 'true';
    const savedEmail = localStorage.getItem('otp_email');
    const savedPhone = localStorage.getItem('otp_phone');
    const savedPassword = localStorage.getItem('otp_password');
    
    if (isInOtpFlow && savedEmail) {
      setIsOtpFlow(true);
      setLoginStep('otp');
      setEmail(savedEmail);
      if (savedPassword) {
        setPassword(savedPassword);
      }
      if (savedPhone) {
        setUserPhone(savedPhone);
        setOtpSent(true);
      }
    }
  }, []);

  useEffect(() => {
    // Check if we're in OTP flow from localStorage
    const isInOtpFlow = localStorage.getItem('otp_flow_active') === 'true';
    
    // Only navigate if we're not in the middle of OTP flow and not currently logging in
    // This prevents conflicts with manual navigation after OTP login
    if (!authLoading && user && userRole && !isOtpFlow && !isInOtpFlow && !loading) {
      if (userRole === 'admin') navigate('/admin/dashboard');
      else if (userRole === 'vendor') navigate('/vendor/dashboard');
      else if (userRole === 'delivery_rider') navigate('/rider/dashboard');
      else navigate('/');
    }
  }, [authLoading, user, userRole, navigate, isOtpFlow, loading]);

  const handleSendOtp = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setOtpLoading(true);
    
    try {
      // First validate credentials
      const { data: authUser, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) throw authError;
      
      // Get user profile to get phone number
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', authUser.user.id)
        .maybeSingle();

      // Sign out immediately after validation
      await supabase.auth.signOut();

      if (profileError) {
        throw new Error('Error fetching user profile. Please contact support.');
      }

      if (!profile?.phone) {
        throw new Error('No phone number found for this account. Please contact support.');
      }

      // Try consolidated briq-sms Edge Function first, fall back to local OTP
      try {
        const result = await sendOTPSMS(email);

        if (result.success) {
          setOtpSent(true);
          const maskedPhone = profile.phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1***$3$4');
          setUserPhone(maskedPhone);
          localStorage.setItem('otp_phone', maskedPhone);
          toast.success('Verification code sent to your registered phone number');
          return;
        } else {
          throw new Error(result.error || 'Edge Function failed');
        }
      } catch (edgeFunctionError) {
        // Fall back to local OTP system
        const result = await sendOTP(email, profile.phone);
        
        if (result.success) {
          setOtpSent(true);
          const maskedPhone = profile.phone.replace(/(\+\d{3})(\d{3})(\d{3})(\d{3})/, '$1***$3$4');
          setUserPhone(maskedPhone);
          localStorage.setItem('otp_phone', maskedPhone);
          toast.success(result.message || `Verification code sent to ${maskedPhone}`);
        } else {
          throw new Error(result.error || 'Failed to send OTP');
        }
      }
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
      // Reset to credentials step on error
      setLoginStep('credentials');
      setIsOtpFlow(false);
      localStorage.removeItem('otp_flow_active');
      localStorage.removeItem('otp_email');
      localStorage.removeItem('otp_phone');
      localStorage.removeItem('otp_password');
      setOtpSent(false);
      setOtp('');
      setUserPhone('');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      // Try Edge Function verification first, fall back to local verification
      let otpValid = false;
      
      try {
        const result = await verifyOTPSMS(email, otp);
        
        if (result.success) {
          otpValid = true;
        } else {
          throw new Error(result.error || 'Edge Function verification failed');
        }
      } catch (edgeFunctionError) {
        // Fall back to local OTP verification
        const result = await verifyOTP(email, otp);
        
        if (result.success) {
          otpValid = true;
        } else {
          throw new Error(result.error || 'Invalid OTP');
        }
      }

      if (!otpValid) {
        throw new Error('OTP verification failed');
      }

      // If OTP is valid, now actually sign in the user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      toast.success('Login successful!');
      
      // Mark OTP flow as complete
      setIsOtpFlow(false);
      localStorage.removeItem('otp_flow_active');
      localStorage.removeItem('otp_email');
      localStorage.removeItem('otp_phone');
      localStorage.removeItem('otp_password');
      
      // Navigate based on user role immediately
      if (signInData?.user) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signInData.user.id);
        
        const roleList = roles?.map(r => r.role) || [];
        
        // Navigate immediately based on role
        if (roleList.includes('admin')) {
          navigate('/admin/dashboard');
        } else if (roleList.includes('vendor')) {
          navigate('/vendor/dashboard');
        } else if (roleList.includes('delivery_rider')) {
          navigate('/rider/dashboard');
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // For login, validate credentials and automatically send OTP
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // If credentials are valid, sign out immediately and send OTP automatically
        await supabase.auth.signOut();
        
        // Set loading to false before switching to OTP step
        setLoading(false);
        
        // Mark that we're starting OTP flow
        setIsOtpFlow(true);
        localStorage.setItem('otp_flow_active', 'true');
        localStorage.setItem('otp_email', email);
        localStorage.setItem('otp_password', password);
        
        // Switch to OTP step first
        setLoginStep('otp');
        
        // Small delay to ensure UI updates, then auto-send OTP
        setTimeout(async () => {
          await handleSendOtp();
        }, 100);
        return;
      } else {
        if (!fullName.trim()) {
          toast.error('Please enter your full name');
          return;
        }
        
        if (!phone.trim()) {
          toast.error('Please enter your phone number');
          return;
        }
        
        // Validate phone number format
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 9 || phoneDigits.length > 12) {
          toast.error('Please enter a valid phone number (e.g., 0712345678 or +255712345678)');
          return;
        }
        
        if (userType === 'vendor' && !businessName.trim()) {
          toast.error('Please enter your business name');
          return;
        }
        
        const { error, data } = await signUp(email, password, fullName);
        if (error) {
          // Handle specific error types
          if (error.message?.includes('rate limit') || error.message?.includes('email rate')) {
            throw new Error('Too many signup attempts. Please wait a few minutes and try again, or contact support to disable email confirmation.');
          } else if (error.message?.includes('already registered')) {
            throw new Error('This email is already registered. Please try signing in instead.');
          } else {
            throw error;
          }
        }
        
        // Update profile with phone number (formatted)
        if (data?.user) {
          const formattedPhone = formatPhoneNumber(phone);
          await supabase
            .from('profiles')
            .update({ phone: formattedPhone })
            .eq('id', data.user.id);
        }
        
        // If registering as vendor, create vendor profile
        if (userType === 'vendor' && data?.user) {
          // Wait a moment for the user session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
            // Only add vendor role (not customer role)
            const { error: roleError } = await supabase
              .from('user_roles')
              .insert([{ user_id: data.user.id, role: 'vendor' }]);

            if (roleError && !roleError.message.includes('duplicate')) {
              console.error('Role error:', roleError);
            }

            const { error: profileError } = await supabase
              .from('vendor_profiles')
              .insert([{
                user_id: data.user.id,
                business_name: businessName,
                business_description: businessDescription || null,
                is_approved: false, // Requires admin approval
              }]);

            if (profileError) {
              console.error('Vendor profile error:', profileError);
            }
            
            toast.success('Vendor account created! Awaiting admin approval before you can start selling.');
          } catch (error) {
            console.error('Post-registration error:', error);
            toast.success('Account created! Please contact admin to complete vendor setup.');
          }
        } else {
          // For regular customers, add customer role
          if (data?.user) {
            try {
              await supabase
                .from('user_roles')
                .insert([{ user_id: data.user.id, role: 'customer' }]);
            } catch (error) {
              console.error('Customer role error:', error);
            }
          }
          
          toast.success('Account created successfully!');
          
          // Show email confirmation message if email confirmation is enabled
          if (data?.user && !data.session) {
            toast.info('Please check your email and click the confirmation link to complete registration.', { duration: 8000 });
          }
        }
        
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary rounded-full p-3">
              <ShoppingCart className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-3xl">SmartCart</CardTitle>
          <CardDescription>
            Your trusted marketplace for quality products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'signup'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              {loginStep === 'credentials' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Enter Verification Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code sent to {userPhone || 'your phone'}
                    </p>
                  </div>
                  
                  {otpLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-sm text-muted-foreground mt-2">Sending verification code...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-otp">Verification Code</Label>
                        <Input
                          id="login-otp"
                          type="text"
                          placeholder="123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                          className="text-center text-lg tracking-widest"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleOtpLogin}
                        disabled={loading || !otp || otp.length !== 6}
                        className="w-full"
                      >
                        {loading ? 'Verifying...' : 'Verify & Login'}
                      </Button>
                      
                      <div className="flex justify-center">
                        <Button 
                          type="button" 
                          onClick={handleSendOtp} 
                          disabled={otpLoading}
                          variant="ghost"
                          size="sm"
                        >
                          Resend Code
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => {
                      setLoginStep('credentials');
                      setIsOtpFlow(false);
                      localStorage.removeItem('otp_flow_active');
                      localStorage.removeItem('otp_email');
                      localStorage.removeItem('otp_phone');
                      localStorage.removeItem('otp_password');
                      setOtpSent(false);
                      setOtp('');
                      setUserPhone('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-3">
                  <Label>I want to register as:</Label>
                  <RadioGroup value={userType} onValueChange={(v) => setUserType(v as 'customer' | 'vendor')}>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent" onClick={() => setUserType('customer')}>
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="flex items-center gap-2 cursor-pointer flex-1">
                        <User className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Customer</div>
                          <div className="text-xs text-muted-foreground">Browse and purchase products</div>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-accent" onClick={() => setUserType('vendor')}>
                      <RadioGroupItem value="vendor" id="vendor" />
                      <Label htmlFor="vendor" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Store className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Vendor</div>
                          <div className="text-xs text-muted-foreground">Sell products on the platform</div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-phone">Phone Number</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="0712345678 or +255712345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                {userType === 'vendor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="business-name">Business Name *</Label>
                      <Input
                        id="business-name"
                        type="text"
                        placeholder="Your Business Name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-desc">Business Description</Label>
                      <Textarea
                        id="business-desc"
                        placeholder="Tell us about your business..."
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                
                {userType === 'vendor' && (
                  <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                    <div className="font-medium text-foreground mb-1">Vendor Account Requirements:</div>
                    <ul className="space-y-1 text-xs">
                      <li>• Admin approval required before selling</li>
                      <li>• You'll receive vendor role only (not customer)</li>
                      <li>• Can add products after approval</li>
                    </ul>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
