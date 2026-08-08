import { describe, it, expect } from 'vitest';
import { handler as submitWaitlistHandler } from '../netlify/functions/submit-waitlist.js';

describe('Hardened Service Expansion Waitlist Endpoint', () => {
  it('should accept valid out-of-area waitlist submission with affirmative consent', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'waitlist_user@example.com',
        phone: '2125551234',
        zipCode: '10001', // Manhattan out of area
        marketingConsent: true
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.message).toContain('service expansion waitlist');
  });

  it('should reject eligible Nassau ZIP (11530 Garden City) from waitlist with HTTP 400', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'eligible_user@example.com',
        zipCode: '11530',
        marketingConsent: true
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.code).toBe('ZIP_IS_ELIGIBLE');
    expect(body.error).toContain('active Nassau & Suffolk County service area');
  });

  it('should reject eligible Suffolk ZIP (11743 Huntington) from waitlist with HTTP 400', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'eligible_user2@example.com',
        zipCode: '11743',
        marketingConsent: true
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.code).toBe('ZIP_IS_ELIGIBLE');
  });

  it('should reject malformed ZIP (115 30) from waitlist with HTTP 400', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        zipCode: '115 30',
        marketingConsent: true
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.code).toBe('INVALID_ZIP');
  });

  it('should reject submission missing affirmative marketing consent', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'user@example.com',
        zipCode: '10001',
        marketingConsent: false
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.code).toBe('CONSENT_REQUIRED');
  });

  it('should reject submission exceeding field length limits', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: 'a'.repeat(260) + '@example.com',
        zipCode: '10001',
        marketingConsent: true
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.error).toContain('allowable length limits');
  });

  it('should reject submission missing email or zip code', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        email: '',
        zipCode: ''
      })
    };

    const res = await submitWaitlistHandler(event);
    expect(res.statusCode).toBe(400);

    const body = JSON.parse(res.body);
    expect(body.success).toBe(false);
  });
});
