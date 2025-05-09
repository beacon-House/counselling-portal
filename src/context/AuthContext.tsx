/**
 * Authentication context for managing user sessions
 * Provides authentication state and methods to the entire app
 * Updated with improved session persistence and debugging
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
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [counsellor, setCounsellor] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to refresh session manually if needed
  const refreshSession = async () => {
    try {
      console.log('Manually refreshing session');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Error refreshing session:', error);
        return;
      }
      
      console.log('Session refreshed successfully:', data.session?.user.id);
      
      // Update session and user
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        
        // Fetch counsellor data with the refreshed session
        await fetchCounsellorData(data.session.user.id);
      }
    } catch (error) {
      console.error('Error in refreshSession:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    console.log('Getting initial auth session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounsellorData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    console.log('Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed, event:', _event);
      console.log('New session user:', session?.user.id || 'No session');
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCounsellorData(session.user.id);
      } else {
        setCounsellor(null);
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth state change listener');
      subscription.unsubscribe();
    };
  }, []);

  const fetchCounsellorData = async (userId: string) => {
    try {
      console.log('Fetching counsellor data for user:', userId);
      const { data, error } = await supabase
        .from('counsellors')
        .select('*')
        .eq('id', userId)
        .single()
        .headers({
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        });

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Counsellor data fetched successfully:', data.name);
        setCounsellor(data as AppUser);
      } else {
        console.warn('No counsellor data found for user:', userId);
      }
    } catch (error) {
      console.error('Error fetching counsellor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Signing in with email:', email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log('Sign in successful');
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
      console.log('Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('Sign out successful');
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
    refreshSession,
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