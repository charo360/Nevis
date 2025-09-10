/**
 * Supabase Configuration
 * Replaces MongoDB for database operations and authentication
 */

// Ensure Buffer polyfill is available before loading Supabase in the browser
import { Buffer as BufferPolyfill } from 'buffer';
// Attach to globalThis so dependencies can access it
// Note: This runs in both server and browser; server already has Buffer.
// In browser, Next 15 doesn't auto-polyfill Node core modules.
if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer === undefined) {
  (globalThis as any).Buffer = BufferPolyfill as any;
}

import { createClient } from '@supabase/supabase-js';

// Supabase configuration from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not found. Please set:');
  console.warn('- NEXT_PUBLIC_SUPABASE_URL');
  console.warn('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Disable email confirmation for development
    flowType: 'implicit'
  }
});

// Database table names
export const TABLES = {
  USERS: 'users',
  BRANDS: 'brands',
  POSTS: 'posts',
  USER_PREFERENCES: 'user_preferences'
} as const;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Export types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          business_type: string;
          description: string | null;
          location: string | null;
          target_audience: string | null;
          brand_voice: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          website: string | null;
          social_media: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          business_name: string;
          business_type: string;
          description?: string | null;
          location?: string | null;
          target_audience?: string | null;
          brand_voice?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          website?: string | null;
          social_media?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          business_type?: string;
          description?: string | null;
          location?: string | null;
          target_audience?: string | null;
          brand_voice?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          website?: string | null;
          social_media?: any | null;
          updated_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          brand_id: string;
          platform: string;
          content: any;
          image_urls: string[] | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          brand_id: string;
          platform: string;
          content: any;
          image_urls?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          brand_id?: string;
          platform?: string;
          content?: any;
          image_urls?: string[] | null;
          metadata?: any | null;
          updated_at?: string;
        };
      };
    };
  };
};

console.log('🔧 Supabase client initialized:', {
  url: supabaseUrl ? '✅ Set' : '❌ Missing',
  key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  configured: isSupabaseConfigured()
});
