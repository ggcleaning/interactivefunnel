import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Slice 3A.0.4 - Staff Auth Cutover & PIN Retirement', () => {
  const rootDir = process.cwd();

  it('1. confirms VITE_ADMIN_PIN is absent from client source code', () => {
    const internalQuoteSource = fs.readFileSync(
      path.resolve(rootDir, 'src/pages/InternalQuotePage.jsx'),
      'utf8'
    );
    expect(internalQuoteSource).not.toContain('VITE_ADMIN_PIN');
    expect(internalQuoteSource).not.toContain('const ADMIN_PIN');
  });

  it('2. confirms default PIN fallback "4455" is absent from client source code', () => {
    const internalQuoteSource = fs.readFileSync(
      path.resolve(rootDir, 'src/pages/InternalQuotePage.jsx'),
      'utf8'
    );
    expect(internalQuoteSource).not.toContain('4455');
  });

  it('3. confirms PIN input UI and error state are absent from InternalQuotePage', () => {
    const internalQuoteSource = fs.readFileSync(
      path.resolve(rootDir, 'src/pages/InternalQuotePage.jsx'),
      'utf8'
    );
    expect(internalQuoteSource).not.toContain('iq-pin-gate');
    expect(internalQuoteSource).not.toContain('iq-pin-card');
    expect(internalQuoteSource).not.toContain('iq-pin-input');
    expect(internalQuoteSource).not.toContain('UNLOCK CONSOLE');
    expect(internalQuoteSource).not.toContain('Invalid PIN');
  });

  it('4. confirms crm.js uses staffApiFetch and sends Authorization bearer tokens', () => {
    const crmSource = fs.readFileSync(
      path.resolve(rootDir, 'src/utils/crm.js'),
      'utf8'
    );
    expect(crmSource).toContain('staffApiFetch');
    expect(crmSource).not.toContain("'x-admin-secret': adminSecret");
  });

  it('5. confirms staffApiClient enforces same-origin and rejects external URLs', async () => {
    const { staffApiFetch } = await import('../../src/lib/staffApiClient.js');
    await expect(
      staffApiFetch('https://evil.example.com/api')
    ).rejects.toThrow('Refusing to attach staff bearer token to external domain');
  });

  it('6. confirms staffApiClient rejects unauthenticated calls when session is missing', async () => {
    const { staffApiFetch } = await import('../../src/lib/staffApiClient.js');
    await expect(
      staffApiFetch('/.netlify/functions/ghl-sync')
    ).rejects.toThrow('Unauthenticated staff session');
  });
});
