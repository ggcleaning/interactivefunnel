import { supabaseAuth } from './supabaseAuthClient';

/**
 * Authenticated Staff API Client
 * Attach Bearer JWT token to staff Netlify endpoints.
 * 
 * @param {string} endpoint - Relative API endpoint (e.g. '/.netlify/functions/ghl-sync')
 * @param {Object} options - Fetch options (method, body, headers)
 * @returns {Promise<any>}
 */
export async function staffApiFetch(endpoint, options = {}) {
  // Enforce same-origin relative endpoints to prevent token leakage
  if (endpoint.includes('://') || endpoint.startsWith('//')) {
    throw new Error('[staffApiClient] Refusing to attach staff bearer token to external domain.');
  }

  const { data: { session } } = await supabaseAuth.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Unauthenticated staff session. Please sign in again.');
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...(options.headers || {})
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(endpoint, config);
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || `Server returned HTTP ${response.status}`);
  }

  return result;
}
