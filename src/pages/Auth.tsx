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
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials');
  const { signIn, signUp, user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && userRole) {
      if (userRole === 'admin') navigate('/admin/dashboard');
      else if (userRole === 'vendor') navigate('/vendor/dashboard');
      else if (userRole === 'delivery_rider') navigate('/rider/dashboard');
      else navigate('/');
    }
  }, [authLoading, user, userRole, navigate]);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setOtpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('otp-auth', {
        body: {
          action: 'generate',
          email: email,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setOtpSent(true);
        toast.success('OTP sent to your registered phone number');
      } else {
        throw new Error(data?.error || 'Failed to send OTP');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
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
      // First verify OTP
      const { data: otpData, error: otpError } = await supabase.functions.invoke('otp-auth', {
        body: {
          action: 'verify',
          email: email,
          otp_code: otp,
        },
      });

      if (otpError) throw otpError;

      if (!otpData?.success) {
        throw new Error(otpData?.error || 'Invalid OTP');
      }

      toast.success('Login successful!');
      
      // Navigate based on user role
      const { data: { user: signedInUser } } = await supabase.auth.getUser();
      if (signedInUser) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signedInUser.id);
        
        const roleList = roles?.map(r => r.role) || [];
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
        // First step: validate credentials
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // After successful login, send OTP
        setLoginStep('otp');
        setLoading(false);
        handleSendOtp();
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
        
        // Update profile with phone number
        if (data?.user) {
          await supabase
            .from('profiles')
            .update({ phone: phone })
            .eq('id', data.user.id);
        }
        
        // If registering as vendor, create vendor profile
        if (userType === 'vendor' && data?.user) {
          // Wait a moment for the user session to be established
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          try {
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
                is_approved: false,
              }]);

            if (profileError) {
              console.error('Vendor profile error:', profileError);
            }
            
            toast.success('Vendor account created! Awaiting admin approval.');
          } catch (error) {
            console.error('Post-registration error:', error);
            // Don't throw here - user is already created, just log the error
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
              // Don't throw - user is created, role can be added later
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
                    <h3 className="text-lg font-semibold">Verify Your Identity</h3>
                    <p className="text-sm text-muted-foreground">
                      We've sent a verification code to your registered phone number
                    </p>
                  </div>
                  
                  {!otpSent ? (
                    <Button 
                      onClick={handleSendOtp} 
                      disabled={otpLoading}
                      className="w-full"
                    >
                      {otpLoading ? 'Sending OTP...' : 'Send Verification Code'}
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-otp">Enter Verification Code</Label>
                        <Input
                          id="login-otp"
                          type="text"
                          placeholder="123456"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          maxLength={6}
                          required
                        />
                      </div>
                      
                      <Button 
                        onClick={handleOtpLogin}
                        disabled={loading || !otp}
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
                      setOtpSent(false);
                      setOtp('');
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
                    placeholder="0712345678"
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
                    Note: Vendor accounts require admin approval before you can start selling.
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
