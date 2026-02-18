import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  adminLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminLoading, setAdminLoading] = useState(true);
  const lastCheckedUserId = useRef<string | null>(null);

  const checkAdminRole = useCallback(async (userId: string) => {
    // Avoid redundant checks for the same user
    if (lastCheckedUserId.current === userId) return;
    lastCheckedUserId.current = userId;
    setAdminLoading(true);
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      setIsAdmin(data && data.length > 0);
    } catch {
      setIsAdmin(false);
    }
    setAdminLoading(false);
  }, []);

  useEffect(() => {
    // 1. Set up listener FIRST (as recommended by Supabase docs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(() => checkAdminRole(session.user.id), 0);
      } else {
        lastCheckedUserId.current = null;
        setIsAdmin(false);
        setAdminLoading(false);
      }
      setLoading(false);
    });

    // 2. Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSession(session);
        setUser(session.user);
        checkAdminRole(session.user.id);
      } else {
        setAdminLoading(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signIn = async (email: string, password: string) => {
    // Reset the cached user id so admin check runs fresh after login
    lastCheckedUserId.current = null;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    lastCheckedUserId.current = null;
    await supabase.auth.signOut();
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, adminLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
