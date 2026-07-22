import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseAuth } from '../lib/supabaseAuthClient';

const StaffAuthContext = createContext(null);

export function StaffAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null);
  const [role, setRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Cryptographically validates active token against Netlify staff-session endpoint
   */
  const verifyServerSession = useCallback(async (accessToken) => {
    if (!accessToken) {
      setStaff(null);
      setRole(null);
      setIsAuthenticated(false);
      return false;
    }

    try {
      const response = await fetch('/.netlify/functions/staff-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok && data.authenticated && data.staff) {
        setStaff(data.staff);
        setRole(data.staff.role);
        setIsAuthenticated(true);
        setAuthError(null);
        return true;
      } else {
        // Access denied or inactive staff account
        setStaff(null);
        setRole(null);
        setIsAuthenticated(false);
        setAuthError(data.error || 'Server authorization denied');
        return false;
      }
    } catch (err) {
      console.error('[StaffAuthProvider] Server verification error:', err.message);
      setStaff(null);
      setRole(null);
      setIsAuthenticated(false);
      setAuthError('Unable to connect to authorization server');
      return false;
    }
  }, []);

  // Initial session restoration & state listener
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data: { session: currentSession } } = await supabaseAuth.auth.getSession();
        if (isMounted) {
          setSession(currentSession);
          if (currentSession?.access_token) {
            await verifyServerSession(currentSession.access_token);
          } else {
            setIsAuthenticated(false);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
        }
      }
    }

    initAuth();

    // Listen for Supabase Auth state events (token refresh, sign in, sign out)
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);

      if (event === 'SIGNED_OUT' || !newSession) {
        setStaff(null);
        setRole(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setIsLoading(false);
      } else if (newSession?.access_token) {
        setIsLoading(true);
        await verifyServerSession(newSession.access_token);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [verifyServerSession]);

  const signIn = async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      setAuthError(error.message || 'Invalid login credentials');
      return { success: false, error: error.message };
    }

    const verified = await verifyServerSession(data.session.access_token);
    setIsLoading(false);

    if (!verified) {
      return { success: false, error: 'Staff account inactive or missing profile' };
    }

    return { success: true, staff: data.user };
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await supabaseAuth.auth.signOut();
    } catch (err) {
      console.error('[StaffAuthProvider] Sign out error:', err.message);
    } finally {
      setSession(null);
      setStaff(null);
      setRole(null);
      setIsAuthenticated(false);
      setAuthError(null);
      setIsLoading(false);
    }
  };

  const refreshStaffSession = async () => {
    if (session?.access_token) {
      setIsLoading(true);
      await verifyServerSession(session.access_token);
      setIsLoading(false);
    }
  };

  const value = {
    session,
    staff,
    role,
    isAuthenticated,
    isLoading,
    authError,
    signIn,
    signOut,
    refreshStaffSession
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error('useStaffAuth must be used within a StaffAuthProvider');
  }
  return context;
}
