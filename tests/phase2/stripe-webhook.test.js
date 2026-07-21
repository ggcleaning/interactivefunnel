import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '../../netlify/functions/stripe-webhook.js';
import Stripe from 'stripe';
import { getSupabaseClient } from '../../netlify/functions/utils/supabaseClient.js';

// Mock Stripe
vi.mock('stripe', () => {
  class StripeMock {
    constructor() {
      this.webhooks = {
        constructEvent: (body, sig, secret) => {
          if (sig === 'invalid_signature') {
            throw new Error('Invalid signature');
          }
          return JSON.parse(body);
        }
      };
    }
  }
  return {
    default: StripeMock,
    Stripe: StripeMock
  };
});

// Mock Supabase Client
vi.mock('../../netlify/functions/utils/supabaseClient.js', () => {
  const mockRpc = vi.fn();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockFrom = vi.fn().mockImplementation(() => {
    return {
      update: mockUpdate,
      eq: mockEq
    };
  });
  
  return {
    getSupabaseClient: vi.fn().mockImplementation(() => {
      return {
        rpc: mockRpc,
        from: mockFrom
      };
    })
  };
});

describe('Phase 2: Stripe Webhook Serverless Function', () => {
  const stripeSecret = 'whsec_test_secret';
  
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret';
    process.env.STRIPE_WEBHOOK_SECRET = stripeSecret;
    process.env.GG_FEATURE_GHL_SYNC = 'false';
  });

  const createEvent = (payload, signature = 'valid_signature') => {
    return {
      httpMethod: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'stripe-signature': signature
      },
      isBase64Encoded: false
    };
  };

  it('rejects non-POST HTTP methods', async () => {
    const res = await handler({ httpMethod: 'GET' });
    expect(res.statusCode).toBe(405);
  });

  it('rejects requests with missing stripe-signature header', async () => {
    const res = await handler({
      httpMethod: 'POST',
      body: '{}',
      headers: {}
    });
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Missing signature or webhook secret configuration');
  });

  it('rejects requests with invalid signature', async () => {
    const mockPayload = { id: 'evt_123', type: 'payment_intent.succeeded' };
    const event = createEvent(mockPayload, 'invalid_signature');
    const res = await handler(event);
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Invalid signature');
  });

  it('ignores unsupported Stripe events (returns 200 and ignored status)', async () => {
    const mockPayload = { id: 'evt_123', type: 'customer.created' };
    const event = createEvent(mockPayload);
    const res = await handler(event);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.ignored).toBe('customer.created');
  });

  it('correctly parses payment_intent.succeeded and calls Supabase RPC', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_abc123',
          amount: 5000,
          amount_received: 5000,
          receipt_email: 'test+phase2@ggcleaningli.com',
          metadata: {
            request_id: 'req_123',
            lead_id: 'GGL-2026-999999',
            funnel_session_id: 'fun_123',
            quote_session_id: 'fun_123',
            internal_quote_id: 'GGQ-2026-999999',
            customer_name: 'Test PhaseTwo',
            customer_phone: '5555550100',
            bedrooms: '3',
            bathrooms: '2',
            sqft: '1500',
            service_type: 'deep',
            frequency: 'weekly'
          }
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        lead_id: 'GGL-2026-999999',
        lead_uuid: 'uuid-123456',
        lead_created: true,
        queue_id: 'q-123456',
        queue_created: true
      },
      error: null
    });

    const event = createEvent(mockEvent);
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.reconciled).toBe(false);

    // Verify RPC call parameters
    expect(supabase.rpc).toHaveBeenCalledTimes(1);
    const args = supabase.rpc.mock.calls[0];
    expect(args[0]).toBe('gg_persist_lead_and_queue');
    
    const params = args[1];
    expect(params.p_lead_id).toBe('GGL-2026-999999');
    expect(params.p_request_id).toBe('req_123');
    expect(params.p_first_name).toBe('Test');
    expect(params.p_last_name).toBe('PhaseTwo');
    expect(params.p_email).toBe('test+phase2@ggcleaningli.com');
    expect(params.p_phone).toBe('5555550100');
    expect(params.p_bedrooms).toBe(3);
    expect(params.p_bathrooms).toBe(2);
    expect(params.p_sqft).toBe(1500);
    expect(params.p_service_category).toBe('deep');
    expect(params.p_frequency).toBe('weekly');
    expect(params.p_stripe_payment_intent_id).toBe('pi_abc123');
    expect(params.p_deposit_amount).toBe(50);
  });

  it('correctly processes duplicate events idempotently (returns reconciled: true)', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_abc123',
          amount: 5000,
          metadata: {
            request_id: 'req_123',
            customer_name: 'Test Duplicate'
          }
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        lead_id: 'GGL-duplicate',
        lead_uuid: 'uuid-123456',
        lead_created: false, // Reconciled / Duplicate
        queue_id: 'q-123456',
        queue_created: false
      },
      error: null
    });

    const event = createEvent(mockEvent);
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.reconciled).toBe(true); // Should return reconciled
  });

  it('marks sync queue complete immediately and does not forward to GHL when GG_FEATURE_GHL_SYNC is false', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_abc123',
          amount: 5000,
          metadata: {
            request_id: 'req_123'
          }
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        lead_id: 'GGL-ghl-disabled',
        lead_uuid: 'uuid-123456',
        lead_created: true,
        queue_id: 'q-123456',
        queue_created: true
      },
      error: null
    });

    const event = createEvent(mockEvent);
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    
    // Confirms that update is called on the sync queue to mark it complete
    expect(supabase.from).toHaveBeenCalledWith('gg_crm_sync_queue');
    const updateSpy = supabase.from().update;
    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      status: 'completed',
      last_error: 'ghl_disabled'
    }));
  });

  it('handles missing metadata by creating a safe fallback record', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_abc123',
          amount: 5000,
          receipt_email: 'fallback@ggcleaningli.com',
          metadata: {} // empty metadata
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        lead_id: 'GGL-fallback',
        lead_uuid: 'uuid-123456',
        lead_created: true,
        queue_id: 'q-123456',
        queue_created: true
      },
      error: null
    });

    const event = createEvent(mockEvent);
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const params = supabase.rpc.mock.calls[0][1];
    expect(params.p_email).toBe('fallback@ggcleaningli.com');
    expect(params.p_request_id).toBe('evt_123'); // Should fallback to event id
    expect(params.p_lead_id).toContain('GGL-ST-'); // Should generate a lead id
  });

  it('correctly handles payment_intent.payment_failed events and disables CRM queueing', async () => {
    const mockEvent = {
      id: 'evt_123',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed123',
          amount: 5000,
          receipt_email: 'failed@ggcleaningli.com',
          metadata: {
            request_id: 'req_123',
            customer_name: 'Test Failed'
          }
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        lead_id: 'GGL-failed',
        lead_uuid: 'uuid-failed',
        lead_created: true,
        queue_id: null,
        queue_created: false
      },
      error: null
    });

    const event = createEvent(mockEvent);
    const res = await handler(event);

    expect(res.statusCode).toBe(200);
    const params = supabase.rpc.mock.calls[0][1];
    expect(params.p_email).toBe('failed@ggcleaningli.com');
    expect(params.p_stripe_payment_intent_id).toBe('pi_failed123');
    expect(params.p_payment_status).toBe('failed');
    expect(params.p_lead_stage).toBe('Payment Failed');
    expect(params.p_enable_crm_queue).toBe(false);
  });
});

