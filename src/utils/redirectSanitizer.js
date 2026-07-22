/**
 * Redirect Sanitizer Utility
 * Ensures returnTo redirect parameters contain only safe, relative internal application routes.
 * 
 * Rejects external URLs, protocol-relative links (//), javascript: schemes, and arbitrary domains.
 */

const ALLOWED_INTERNAL_PREFIXES = [
  '/operations',
  '/internal-quote',
  '/staff-login'
];

export function sanitizeRedirectUrl(rawUrl, defaultFallback = '/operations') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return defaultFallback;
  }

  const trimmed = rawUrl.trim();

  // Reject empty or non-relative paths
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return defaultFallback;
  }

  // Reject dangerous schemes or control characters
  if (trimmed.includes(':') || trimmed.includes('\\') || /[\r\n\t]/.test(trimmed)) {
    return defaultFallback;
  }

  // Strip query string for path verification
  const pathOnly = trimmed.split('?')[0].split('#')[0];

  // Verify path matches an allowed internal route prefix
  const isAllowed = ALLOWED_INTERNAL_PREFIXES.some(prefix => 
    pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  );

  if (!isAllowed) {
    return defaultFallback;
  }

  return trimmed;
}
