import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, getPrimaryRole } from '@/lib/user-role';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role?: AppRole) => Promise<{ data?: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const clearLoadingTimeout = () => {
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };

    const startLoadingFailSafe = () => {
      clearLoadingTimeout();
      loadingTimeoutRef.current = window.setTimeout(() => {
        if (mounted) {
          setLoading(false);
        }
      }, 5000);
    };

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (!nextSession?.user) {
        setUserRole(null);
        setLoading(false);
        clearLoadingTimeout();
        return;
      }

      startLoadingFailSafe();
      await fetchUserRole(nextSession.user.id);
      clearLoadingTimeout();
    };

    const bootstrap = async () => {
      try {
        setLoading(true);
        startLoadingFailSafe();
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          await applySession(null);
          return;
        }

        await applySession(data.session);
      } catch (error) {
        console.error('Error bootstrapping auth:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setLoading(true);
      void applySession(nextSession);
    });

    return () => {
      mounted = false;
      clearLoadingTimeout();
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const roles = (data ?? []).map((r) => r.role);
      setUserRole(getPrimaryRole(roles));
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setUserRole(null);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: AppRole = 'customer') => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role,
        },
      },
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Supabase sign out error:', error);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
      setSession(null);
      setUserRole(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
