import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ data?: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserId = useRef<string | null>(null);
  const isInitialized = useRef(false);
  const authStateRef = useRef<{ user: User | null; session: Session | null }>({ user: null, session: null });

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.id);
        
        // Prevent processing duplicate events
        const currentState = { user: session?.user ?? null, session };
        if (
          authStateRef.current.user?.id === currentState.user?.id &&
          authStateRef.current.session?.access_token === currentState.session?.access_token &&
          event !== 'INITIAL_SESSION'
        ) {
          return; // Skip duplicate events
        }
        
        authStateRef.current = currentState;
        
        // Only process significant auth events, ignore INITIAL_SESSION completely
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Only fetch role if it's a different user or we don't have a role yet
            if (lastFetchedUserId.current !== session.user.id) {
              setLoading(true);
              await fetchUserRole(session.user.id);
            } else if (!userRole) {
              setLoading(true);
              await fetchUserRole(session.user.id);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          lastFetchedUserId.current = null;
        }
        // Completely ignore INITIAL_SESSION and other events to prevent loops
      }
    );

    // Check for existing session only once
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        authStateRef.current = { user: session.user, session };
        setSession(session);
        setUser(session.user);
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Prevent unnecessary fetches
      if (lastFetchedUserId.current === userId && userRole) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) throw error;

      const roles = (data ?? []).map((r) => r.role);

      // Priority order for routing/guards when user has multiple roles
      let newRole: string | null = null;
      if (roles.includes('admin')) {
        newRole = 'admin';
      } else if (roles.includes('vendor')) {
        newRole = 'vendor';
      } else if (roles.includes('delivery_rider')) {
        newRole = 'delivery_rider';
      } else if (roles.includes('customer')) {
        newRole = 'customer';
      }

      setUserRole(newRole);
      lastFetchedUserId.current = userId;
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
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
    await supabase.auth.signOut();
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
