/**
 * Redirect Sanitizer Utility
 * Ensures returnTo redirect parameters contain only safe, relative internal application routes.
 * 
 * Allowed destinations: /operations and /internal-quote (with parameters).
 * Rejects /staff-login, external URLs, protocol-relative links (//), encoded redirects, backslashes, and javascript: schemes.
 */

const ALLOWED_INTERNAL_PREFIXES = [
  '/operations',
  '/internal-quote'
];

export function sanitizeRedirectUrl(rawUrl, defaultFallback = '/operations') {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return defaultFallback;
  }

  const trimmed = rawUrl.trim();

  // Handle URL decoding safely
  let decoded = trimmed;
  try {
    decoded = decodeURIComponent(trimmed).trim();
  } catch (e) {
    return defaultFallback;
  }

  // Reject non-relative paths, protocol-relative links (//), backslashes (\), schemes (:), or control characters
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.startsWith('/\\') ||
    trimmed.includes('\\') ||
    trimmed.includes(':') ||
    /[\r\n\t]/.test(trimmed) ||
    !decoded.startsWith('/') ||
    decoded.startsWith('//') ||
    decoded.startsWith('/\\') ||
    decoded.includes('\\') ||
    decoded.includes(':')
  ) {
    return defaultFallback;
  }

  // Strip query string & hash for path verification
  const pathOnly = trimmed.split('?')[0].split('#')[0];

  // Explicitly reject /staff-login as a return destination
  if (pathOnly === '/staff-login' || pathOnly.startsWith('/staff-login/')) {
    return defaultFallback;
  }

  // Verify path matches an allowed internal route prefix
  const isAllowed = ALLOWED_INTERNAL_PREFIXES.some(prefix => 
    pathOnly === prefix || pathOnly.startsWith(`${prefix}/`)
  );

  if (!isAllowed) {
    return defaultFallback;
  }

  return trimmed;
}
