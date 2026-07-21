import { createClient } from '@supabase/supabase-js';

/**
 * Server-side JWT validation & role enforcement utility for Netlify Functions.
 * 
 * @param {Object} event - Netlify Function event object
 * @param {Object} options - Options object ({ allowedRoles: ['owner_admin', 'staff'] })
 * @returns {Promise<{ authorized: boolean, statusCode?: number, error?: string, userContext?: Object }>}
 */
export async function requireStaffAuth(event, options = {}) {
  const allowedRoles = options.allowedRoles || ['owner_admin', 'staff'];
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('[requireStaffAuth] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
    return {
      authorized: false,
      statusCode: 500,
      error: 'Server security configuration error'
    };
  }

  // 1. Extract Authorization header
  const authHeader = event.headers['authorization'] || event.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Missing or malformed Authorization header'
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Missing bearer token'
    };
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 2. Cryptographically validate JWT token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return {
        authorized: false,
        statusCode: 401,
        error: 'Invalid or expired access token'
      };
    }

    const authUser = authData.user;

    // 3. Query gg_staff_profiles table to verify active staff status & role
    const { data: profile, error: profileError } = await supabase
      .from('gg_staff_profiles')
      .select('user_id, email, display_name, role, is_active')
      .eq('user_id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('[requireStaffAuth] Database query error:', profileError.message);
      return {
        authorized: false,
        statusCode: 500,
        error: 'Error validating staff credentials'
      };
    }

    if (!profile) {
      return {
        authorized: false,
        statusCode: 403,
        error: 'No staff profile associated with this user'
      };
    }

    if (!profile.is_active) {
      return {
        authorized: false,
        statusCode: 403,
        error: 'Staff account is inactive'
      };
    }

    if (!allowedRoles.includes(profile.role)) {
      return {
        authorized: false,
        statusCode: 403,
        error: `Insufficient permissions. Required role: ${allowedRoles.join(' or ')}`
      };
    }

    // 4. Return sanitized safe user context (NEVER returns token or service role keys)
    return {
      authorized: true,
      userContext: {
        userId: profile.user_id,
        email: profile.email,
        displayName: profile.display_name || profile.email,
        role: profile.role
      }
    };
  } catch (err) {
    console.error('[requireStaffAuth] Unexpected error:', err.message);
    return {
      authorized: false,
      statusCode: 500,
      error: 'Unexpected server authentication failure'
    };
  }
}
