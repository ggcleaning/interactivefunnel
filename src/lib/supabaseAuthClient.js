import { createClient } from '@supabase/supabase-js';

// Read browser-safe environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://umeknlmqunvfqpxoprjd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_anon_key_for_tests';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[supabaseAuthClient] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
}

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gg_staff_auth_session'
  }
});

/**
 * Helper to retrieve the current active staff session from local state
 */
export async function getActiveStaffSession() {
  try {
    const { data: { session }, error } = await supabaseAuth.auth.getSession();
    if (error || !session) return null;
    return session;
  } catch (err) {
    console.error('[supabaseAuthClient] Failed to retrieve session:', err.message);
    return null;
  }
}

/**
 * Helper to sign in staff user with email and password
 */
export async function signInStaff(email, password) {
  return await supabaseAuth.auth.signInWithPassword({ email, password });
}

/**
 * Helper to sign out current staff user
 */
export async function signOutStaff() {
  return await supabaseAuth.auth.signOut();
}
