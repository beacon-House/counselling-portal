/**
 * Supabase client configuration
 * Creates a singleton client instance for use throughout the application
 * Updated to disable caching for better file access reliability
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create custom fetch with cache control headers
const customFetch = (url: RequestInfo | URL, options: RequestInit = {}) => {
  // Add cache control headers to prevent browser caching
  const headers = {
    ...options.headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

// Create Supabase client with custom fetch
export const supabase = createClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    global: {
      fetch: customFetch,
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

// Console log to verify the client is initializing correctly
console.log('Supabase client initialized with cache-disabled fetch');