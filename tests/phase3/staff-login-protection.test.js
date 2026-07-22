import { describe, it, expect } from 'vitest';
import { sanitizeRedirectUrl } from '../../src/utils/redirectSanitizer';
import fs from 'fs';
import path from 'path';

describe('Phase 3A.0.3: Staff Login, Verified Route Protection, and Logout', () => {

  describe('Redirect Sanitizer Tests', () => {
    it('1-2. Returns default fallback for empty, null, or non-string inputs', () => {
      expect(sanitizeRedirectUrl(null)).toBe('/operations');
      expect(sanitizeRedirectUrl(undefined)).toBe('/operations');
      expect(sanitizeRedirectUrl('')).toBe('/operations');
      expect(sanitizeRedirectUrl(12345)).toBe('/operations');
    });

    it('3. Restores safe valid internal returnTo paths', () => {
      expect(sanitizeRedirectUrl('/operations')).toBe('/operations');
      expect(sanitizeRedirectUrl('/internal-quote')).toBe('/internal-quote');
      expect(sanitizeRedirectUrl('/internal-quote?lead=uuid-123')).toBe('/internal-quote?lead=uuid-123');
      expect(sanitizeRedirectUrl('/internal-quote?quote=GGQ-2026-104928')).toBe('/internal-quote?quote=GGQ-2026-104928');
    });

    it('4. Rejects /staff-login and nested /staff-login return destinations', () => {
      expect(sanitizeRedirectUrl('/staff-login')).toBe('/operations');
      expect(sanitizeRedirectUrl('/staff-login?returnTo=/staff-login')).toBe('/operations');
      expect(sanitizeRedirectUrl('/staff-login/deep')).toBe('/operations');
    });

    it('5. Rejects external URLs and domain redirects', () => {
      expect(sanitizeRedirectUrl('https://evil.example')).toBe('/operations');
      expect(sanitizeRedirectUrl('http://malicious.org/internal-quote')).toBe('/operations');
    });

    it('6. Rejects protocol-relative links (//)', () => {
      expect(sanitizeRedirectUrl('//evil.example')).toBe('/operations');
      expect(sanitizeRedirectUrl('//evil.com/internal-quote')).toBe('/operations');
      expect(sanitizeRedirectUrl('//google.com')).toBe('/operations');
    });

    it('7. Rejects javascript: and data: schemes', () => {
      expect(sanitizeRedirectUrl('javascript:alert(1)')).toBe('/operations');
      expect(sanitizeRedirectUrl('data:text/html,<script>')).toBe('/operations');
    });

    it('8. Rejects encoded protocol-relative URLs', () => {
      expect(sanitizeRedirectUrl('%2F%2Fevil.example')).toBe('/operations');
      expect(sanitizeRedirectUrl('%2F%2Fevil.com%2Foperations')).toBe('/operations');
    });

    it('9. Rejects backslash-based URL variants', () => {
      expect(sanitizeRedirectUrl('/\\evil.com')).toBe('/operations');
      expect(sanitizeRedirectUrl('\\\\evil.example')).toBe('/operations');
      expect(sanitizeRedirectUrl('/\\operations')).toBe('/operations');
      expect(sanitizeRedirectUrl('\\operations')).toBe('/operations');
    });
  });

  describe('UI & Secret Code Inspection', () => {
    it('16. No public registration link exists on StaffLoginPage', () => {
      const loginPath = path.join(__dirname, '../../src/pages/StaffLoginPage.jsx');
      const code = fs.readFileSync(loginPath, 'utf8');

      expect(code).not.toContain('/register');
      expect(code).not.toContain('/signup');
      expect(code).not.toContain('Create Account');
    });

    it('17. No shared PIN field appears on StaffLoginPage', () => {
      const loginPath = path.join(__dirname, '../../src/pages/StaffLoginPage.jsx');
      const code = fs.readFileSync(loginPath, 'utf8');

      expect(code).not.toContain('ADMIN_PIN');
      expect(code).not.toContain('4455');
      expect(code).not.toContain('PIN Code');
    });

    it('18. No service role secret key exists in frontend auth provider or pages', () => {
      const filesToScan = [
        '../../src/auth/StaffAuthProvider.jsx',
        '../../src/auth/ProtectedStaffRoute.jsx',
        '../../src/lib/supabaseAuthClient.js',
        '../../src/pages/StaffLoginPage.jsx',
        '../../src/pages/OperationsDashboardPage.jsx'
      ];

      filesToScan.forEach(relPath => {
        const fullPath = path.join(__dirname, relPath);
        const code = fs.readFileSync(fullPath, 'utf8');
        expect(code).not.toContain('SERVICE_ROLE');
        expect(code).not.toContain('sb_secret_');
        expect(code).not.toContain('INTERNAL_ADMIN_SECRET');
      });
    });
  });
});
