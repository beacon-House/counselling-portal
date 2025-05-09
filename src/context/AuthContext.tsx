/**
 * Authentication context for managing user sessions
 * Provides authentication state and methods to the entire app
 * Improved error handling for network connectivity issues
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as AppUser } from '../types/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  counsellor: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  retryFetchCounsellor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [counsellor, setCounsellor] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounsellorData(session.user.id)
          .catch(err => {
            console.warn('Initial counsellor data fetch failed, continuing with limited functionality:', err.message);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    })
    .catch(error => {
      console.error('Error getting initial session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounsellorData(session.user.id)
          .catch(err => {
            console.warn('Auth state change counsellor data fetch failed:', err.message);
            setLoading(false);
          });
      } else {
        setCounsellor(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCounsellorData = async (userId: string) => {
    try {
      // Check network connectivity before making the request
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const { data, error } = await supabase
        .from('counsellors')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setCounsellor(data as AppUser);
      }
    } catch (error: any) {
      // More specific error handling with different error types
      if (error.message === 'Failed to fetch' || !navigator.onLine) {
        console.error('Network error when fetching counsellor data. Please check your connection:', error);
      } else if (error.code === 'PGRST116') {
        console.error('No matching counsellor found in database:', error);
      } else {
        console.error('Error fetching counsellor data:', error);
      }
      
      // Don't throw the error again, let the app continue with limited functionality
    } finally {
      setLoading(false);
    }
  };

  // Add a retry function
  const retryFetchCounsellor = async () => {
    if (user) {
      setLoading(true);
      await fetchCounsellorData(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    session,
    user,
    counsellor,
    loading,
    signIn,
    signOut,
    retryFetchCounsellor,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}