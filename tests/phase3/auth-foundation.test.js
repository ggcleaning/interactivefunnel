import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

let mockUser = null;
let mockProfile = null;
let mockDbError = null;

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn((url, key) => {
      if (!url || !key) {
        throw new Error('Missing Supabase configuration');
      }
      return {
        auth: {
          getUser: vi.fn(async (token) => {
            if (token === 'invalid_token_123' || token === 'expired_token_xyz' || !mockUser) {
              return { data: { user: null }, error: new Error('Invalid or expired token') };
            }
            return { data: { user: mockUser }, error: null };
          })
        },
        from: vi.fn((table) => {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn(async () => {
              if (mockDbError) {
                return { data: null, error: mockDbError };
              }
              return { data: mockProfile, error: null };
            })
          };
        })
      };
    })
  };
});

import { requireStaffAuth } from '../../netlify/functions/utils/requireStaffAuth.js';
import { handler as staffSessionHandler } from '../../netlify/functions/staff-session.js';

describe('Phase 3A.0: Supabase Staff Auth Foundation & Server Authorization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    mockUser = null;
    mockProfile = null;
    mockDbError = null;
    process.env = {
      ...originalEnv,
      SUPABASE_URL: 'https://test-project.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test_service_role_key_secret_12345'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('1. Missing Authorization header returns 401', async () => {
    const res = await requireStaffAuth({ headers: {} });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.error).toContain('Missing or malformed Authorization header');
  });

  it('2. Invalid header format returns 401', async () => {
    const res = await requireStaffAuth({ headers: { authorization: 'Basic dXNlcjpwYXNz' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('3. Empty bearer token returns 401', async () => {
    const res = await requireStaffAuth({ headers: { authorization: 'Bearer ' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('4. Invalid token returns 401', async () => {
    const res = await requireStaffAuth({ headers: { authorization: 'Bearer invalid_token_123' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(401);
    expect(res.error).toContain('Invalid or expired access token');
  });

  it('5. Expired token returns 401', async () => {
    const res = await requireStaffAuth({ headers: { authorization: 'Bearer expired_token_xyz' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(401);
  });

  it('6. Valid Auth user without staff profile returns 403', async () => {
    mockUser = { id: 'uuid-noprofile-1', email: 'noprofile@ggcleaningli.com' };
    mockProfile = null;

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.error).toContain('No staff profile associated');
  });

  it('7. Inactive staff profile returns 403', async () => {
    mockUser = { id: 'uuid-inactive-1', email: 'inactive@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-inactive-1', email: 'inactive@ggcleaningli.com', role: 'staff', is_active: false };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.error).toContain('Staff account is inactive');
  });

  it('8. Unsupported role returns 403', async () => {
    mockUser = { id: 'uuid-guest-1', email: 'guest@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-guest-1', email: 'guest@ggcleaningli.com', role: 'guest', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('9. Active staff user is accepted', async () => {
    mockUser = { id: 'uuid-staff-1', email: 'staff@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-staff-1', email: 'staff@ggcleaningli.com', display_name: 'Roberto Staff', role: 'staff', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(true);
    expect(res.userContext.role).toBe('staff');
    expect(res.userContext.email).toBe('staff@ggcleaningli.com');
  });

  it('10. Active owner_admin user is accepted', async () => {
    mockUser = { id: 'uuid-owner-1', email: 'owner@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-owner-1', email: 'owner@ggcleaningli.com', display_name: 'Griselda Owner', role: 'owner_admin', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(true);
    expect(res.userContext.role).toBe('owner_admin');
  });

  it('11. Owner-only endpoint rejects staff role', async () => {
    mockUser = { id: 'uuid-staff-1', email: 'staff@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-staff-1', email: 'staff@ggcleaningli.com', role: 'staff', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } }, { allowedRoles: ['owner_admin'] });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(403);
  });

  it('12. Owner-only endpoint accepts owner_admin', async () => {
    mockUser = { id: 'uuid-owner-1', email: 'owner@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-owner-1', email: 'owner@ggcleaningli.com', role: 'owner_admin', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } }, { allowedRoles: ['owner_admin'] });
    expect(res.authorized).toBe(true);
    expect(res.userContext.role).toBe('owner_admin');
  });

  it('13. Missing Supabase configuration fails closed with 500', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(500);
  });

  it('14. Supabase lookup errors return sanitized 500 responses', async () => {
    mockUser = { id: 'uuid-dberror-1', email: 'dberror@ggcleaningli.com' };
    mockDbError = { message: 'Database connection failure' };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    expect(res.authorized).toBe(false);
    expect(res.statusCode).toBe(500);
    expect(res.error).toBe('Error validating staff credentials');
  });

  it('15-16. Access tokens and service-role keys never leak in responses', async () => {
    mockUser = { id: 'uuid-owner-1', email: 'owner@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-owner-1', email: 'owner@ggcleaningli.com', role: 'owner_admin', is_active: true };

    const res = await requireStaffAuth({ headers: { authorization: 'Bearer valid_token' } });
    const resString = JSON.stringify(res);
    expect(resString).not.toContain('valid_token');
    expect(resString).not.toContain(process.env.SUPABASE_SERVICE_ROLE_KEY);
  });

  it('17. staff-session rejects POST with 405 Method Not Allowed', async () => {
    const event = { httpMethod: 'POST', headers: {} };
    const res = await staffSessionHandler(event);
    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).error).toBe('Method Not Allowed');
  });

  it('18. staff-session returns safe fields only for valid staff bearer token', async () => {
    mockUser = { id: 'uuid-owner-1', email: 'owner@ggcleaningli.com' };
    mockProfile = { user_id: 'uuid-owner-1', email: 'owner@ggcleaningli.com', display_name: 'Griselda Admin', role: 'owner_admin', is_active: true };

    const event = { httpMethod: 'GET', headers: { authorization: 'Bearer valid_token' } };
    const res = await staffSessionHandler(event);
    expect(res.statusCode).toBe(200);
    
    const body = JSON.parse(res.body);
    expect(body.authenticated).toBe(true);
    expect(body.staff).toEqual({
      user_id: 'uuid-owner-1',
      email: 'owner@ggcleaningli.com',
      display_name: 'Griselda Admin',
      role: 'owner_admin'
    });
    expect(res.body).not.toContain('service_role');
    expect(res.body).not.toContain('valid_token');
  });

  it('19-20. Migration file correctly revokes PUBLIC, anon, and authenticated direct table access', () => {
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20260721000001_gg_staff_auth.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.gg_staff_profiles');
    expect(sql).toContain('REVOKE ALL ON TABLE public.gg_staff_profiles FROM PUBLIC;');
    expect(sql).toContain('REVOKE ALL ON TABLE public.gg_staff_profiles FROM anon;');
    expect(sql).toContain('REVOKE ALL ON TABLE public.gg_staff_profiles FROM authenticated;');
    expect(sql).toContain('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.gg_staff_profiles TO service_role;');
  });

  it('25. Browser bundle secret scan passes (No SUPABASE_SERVICE_ROLE_KEY or secrets in src/lib)', () => {
    const clientPath = path.join(__dirname, '../../src/lib/supabaseAuthClient.js');
    const clientCode = fs.readFileSync(clientPath, 'utf8');

    expect(clientCode).not.toContain('SERVICE_ROLE');
    expect(clientCode).not.toContain('INTERNAL_ADMIN_SECRET');
    expect(clientCode).toContain('import.meta.env.VITE_SUPABASE_URL');
    expect(clientCode).toContain('import.meta.env.VITE_SUPABASE_ANON_KEY');
  });
});
