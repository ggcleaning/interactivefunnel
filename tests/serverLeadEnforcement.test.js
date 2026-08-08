import { describe, it, expect } from 'vitest';
import { handler as persistLeadHandler } from '../netlify/functions/persist-lead.js';
import { handler as createPaymentIntentHandler } from '../netlify/functions/create-payment-intent.js';
import { handler as submitPhotoQuoteHandler } from '../netlify/functions/submit-photo-quote.js';
import { handler as crmProxyHandler } from '../netlify/functions/crm-proxy.js';
import { handler as ghlSyncHandler } from '../netlify/functions/ghl-sync.js';

describe('Server-Authoritative Lead & ZIP Enforcement (Zero Prohibited Side Effects)', () => {
  it('persist-lead should reject out-of-area California ZIP with HTTP 422', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '5165551234',
          zipCode: '90210'
        },
        type: 'lead_capture'
      })
    };

    const res = await persistLeadHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
    expect(body.code).toBe('OUTSIDE_SERVICE_AREA');
    expect(body.details.status).toBe('OUTSIDE_SERVICE_AREA');
    });

  it('persist-lead should reject Queens NYC out-of-county ZIP with HTTP 422', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '7185551234',
          zipCode: '11375'
        },
        type: 'lead_capture'
      })
    };

    const res = await persistLeadHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
    });

  it('persist-lead should reject malformed ZIP (115 30) with HTTP 422', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        data: {
          firstName: 'Bob',
          lastName: 'Jones',
          email: 'bob@example.com',
          phone: '5165551234',
          zipCode: '115 30'
        },
        type: 'lead_capture'
      })
    };

    const res = await persistLeadHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
    expect(body.details.status).toBe('INVALID_ZIP');
  });

  it('create-payment-intent should reject out-of-area ZIP with HTTP 422 before Stripe creation', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '5165551234',
        zipCode: '10601', // Westchester
        payment_flow: 'estimate_widget'
      })
    };

    const res = await createPaymentIntentHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
  });

  it('submit-photo-quote should reject out-of-area ZIP with HTTP 422 before email dispatch', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        name: 'Out of Area User',
        email: 'user@example.com',
        phone: '5165551234',
        zipCode: '90210',
        serviceType: 'Deep Clean'
      })
    };

    const res = await submitPhotoQuoteHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
  });

  it('crm-proxy should reject out-of-area ZIP with HTTP 422 before GHL forward', async () => {
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify({
        data: {
          name: 'Proxy Lead',
          email: 'proxy@example.com',
          zipCode: '90210'
        },
        type: 'quote_requested'
      })
    };

    const res = await crmProxyHandler(event);
    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
  });

  it('ghl-sync should reject out-of-area ZIP on sync action with HTTP 422', async () => {
    const originalSecret = process.env.INTERNAL_ADMIN_SECRET;
    process.env.INTERNAL_ADMIN_SECRET = 'test-secret';

    const event = {
      httpMethod: 'POST',
      headers: {
        'x-admin-secret': 'test-secret'
      },
      body: JSON.stringify({
        customerData: {
          name: 'Staff Quote Customer',
          email: 'staff@example.com',
          zipCode: '90210'
        },
        action: 'sync'
      })
    };

    const res = await ghlSyncHandler(event);
    process.env.INTERNAL_ADMIN_SECRET = originalSecret;

    expect(res.statusCode).toBe(422);

    const body = JSON.parse(res.body);
    expect(body.error).toBe('OUTSIDE_SERVICE_AREA');
  });
});

