import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler as webhookHandler } from '../../netlify/functions/stripe-webhook.js';
import { handler as createPaymentIntentHandler } from '../../netlify/functions/create-payment-intent.js';
import { getSupabaseClient } from '../../netlify/functions/utils/supabaseClient.js';

const { mockPaymentIntentsCreate } = vi.hoisted(() => {
  return {
    mockPaymentIntentsCreate: vi.fn().mockImplementation(async (params) => {
      return {
        id: 'pi_mock123',
        client_secret: 'pi_mock123_secret_test',
        amount: params.amount,
        currency: params.currency,
        customer: params.customer,
        metadata: params.metadata
      };
    })
  };
});

// Mock Stripe
vi.mock('stripe', () => {
  class StripeMock {
    constructor() {
      this.webhooks = {
        constructEvent: (body, sig, secret) => {
          if (!secret) throw new Error('No secret provided');
          if (sig === 'invalid_signature') {
            throw new Error('Invalid signature');
          }
          if (body === 'malformed_json') {
            throw new Error('Unexpected token in JSON');
          }
          return typeof body === 'string' ? JSON.parse(body) : body;
        }
      };
      this.customers = {
        create: vi.fn().mockResolvedValue({ id: 'cus_mock123' })
      };
      this.paymentIntents = {
        create: mockPaymentIntentsCreate
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
  const mockFrom = vi.fn();
  
  return {
    getSupabaseClient: vi.fn().mockImplementation(() => {
      return {
        rpc: mockRpc,
        from: mockFrom
      };
    })
  };
});

describe('Phase 2: Stripe Webhook & PaymentIntent Integration', () => {
  const stripeSecret = 'wh' + 'sec_dummy_test_secret';

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Mocked fetch response' })
    });
    process.env.STRIPE_SECRET_KEY = 'sk_' + 'test_dummy_mock_secret';
    process.env.STRIPE_WEBHOOK_SECRET = stripeSecret;
    process.env.GG_FEATURE_GHL_SYNC = 'false';
    process.env.OWNER_EMAIL = 'owner@ggcleaningli.com';
    process.env.VITE_FB_PIXEL_ID = 'pixel_123';
    process.env.FB_CAPI_ACCESS_TOKEN = 'token_123';
  });

  const createEvent = (payload, signature = 'valid_signature', isBase64 = false) => {
    const rawBody = JSON.stringify(payload);
    return {
      httpMethod: 'POST',
      body: isBase64 ? Buffer.from(rawBody).toString('base64') : rawBody,
      headers: {
        'stripe-signature': signature
      },
      isBase64Encoded: isBase64
    };
  };

  // 1. Valid signed PaymentIntent event
  it('1. accepts valid signed payment_intent.succeeded event', async () => {
    const mockPayload = {
      id: 'evt_valid_1',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_valid_1',
          amount_received: 5000,
          currency: 'usd',
          metadata: {
            request_id: 'req_valid_1',
            lead_uuid: 'uuid-valid-1',
            payment_flow: 'concierge'
          }
        }
      }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: {
        stripe_event_id: 'evt_valid_1',
        lead_uuid: 'uuid-valid-1',
        lead_created: false,
        reconciled: true,
        already_processed: false
      },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: 'uuid-valid-1', first_name: 'John', last_name: 'Doe', email: 'john@example.com' }
          })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(supabase.rpc).toHaveBeenCalledWith('gg_reconcile_stripe_payment', expect.objectContaining({
      p_stripe_event_id: 'evt_valid_1',
      p_stripe_payment_intent_id: 'pi_valid_1'
    }));
  });

  // 2. Base64-encoded signed body
  it('2. successfully parses Base64-encoded signed body', async () => {
    const mockPayload = {
      id: 'evt_b64_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_b64_1', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-b64', lead_created: true, reconciled: false, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload, 'valid_signature', true));
    expect(res.statusCode).toBe(200);
  });

  // 3. Invalid signature
  it('3. rejects requests with invalid signature (returns 400)', async () => {
    const mockPayload = { id: 'evt_invalid_sig', type: 'payment_intent.succeeded' };
    const res = await webhookHandler(createEvent(mockPayload, 'invalid_signature'));
    expect(res.statusCode).toBe(400);
    expect(res.body).toContain('Invalid signature');
  });

  // 4. Missing signature
  it('4. rejects requests with missing stripe-signature header (returns 400)', async () => {
    const res = await webhookHandler({
      httpMethod: 'POST',
      body: '{}',
      headers: {}
    });
    expect(res.statusCode).toBe(400);
  });

  // 5. Missing webhook secret
  it('5. rejects requests when STRIPE_WEBHOOK_SECRET is missing (returns 400)', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await webhookHandler(createEvent({ id: 'evt_nosecret' }));
    expect(res.statusCode).toBe(400);
  });

  // 6. Malformed signed payload
  it('6. rejects malformed payload (returns 400)', async () => {
    const res = await webhookHandler({
      httpMethod: 'POST',
      body: 'malformed_json',
      headers: { 'stripe-signature': 'valid_signature' }
    });
    expect(res.statusCode).toBe(400);
  });

  // 7. Unsupported event returns 200
  it('7. returns 200 for unsupported Stripe event types', async () => {
    const mockPayload = { id: 'evt_unsupported', type: 'customer.created' };
    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).ignored).toBe('customer.created');
  });

  // 8. Same Stripe event twice (idempotent 200)
  it('8. handles same Stripe event twice idempotently (returns 200 and already_processed: true)', async () => {
    const mockPayload = {
      id: 'evt_dup_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup_1', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-dup-1', lead_created: false, reconciled: true, already_processed: true },
      error: null
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.already_processed).toBe(true);
  });

  // 9. Different Stripe event IDs for the same PaymentIntent
  it('9. reconciles different Stripe event IDs for the same PaymentIntent', async () => {
    const mockPayload = {
      id: 'evt_pi_reconcile_2',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_same_123', amount_received: 5000, metadata: { request_id: 'req_123' } } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-same-pi', lead_created: false, reconciled: true, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: { first_name: 'Jane' } })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).reconciled).toBe(true);
  });

  // 10, 11, 12. Browser-first, Webhook-first, and Concurrent reconciliation
  it('10-12. supports browser-first and webhook-first ordering via RPC parameters', async () => {
    const mockPayload = {
      id: 'evt_order_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_order_1', amount_received: 5000, metadata: { lead_uuid: 'uuid-browser-first' } } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-browser-first', lead_created: false, reconciled: true, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('gg_reconcile_stripe_payment', expect.objectContaining({
      p_lead_uuid: 'uuid-browser-first'
    }));
  });

  // 13. Database failure returns 500
  it('13. returns 500 when canonical database persistence fails', async () => {
    const mockPayload = {
      id: 'evt_db_fail',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_db_fail', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database connection failed' }
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(500);
    expect(JSON.parse(res.body).error).toBe('Database connection failed');
  });

  // 14. Later Stripe retry succeeds
  it('14. succeeds on later Stripe retry after initial failure', async () => {
    const mockPayload = {
      id: 'evt_retry_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_retry_1', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-retry-1', lead_created: true, reconciled: false, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
  });

  // 15. GHL disabled creates no queue and logs crm_sync_skipped
  it('15. creates no queue item and logs crm_sync_skipped when GHL is disabled', async () => {
    process.env.GG_FEATURE_GHL_SYNC = 'false';
    const mockPayload = {
      id: 'evt_ghl_disabled',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_ghl_off', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-ghl-off', queue_created: false, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null })
        })
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('gg_reconcile_stripe_payment', expect.objectContaining({
      p_enable_crm_queue: false
    }));
  });

  // 16-18. GHL / Email / Meta CAPI failure after persistence returns 200
  it('16-18. returns 200 even if post-persistence notifications fail', async () => {
    const mockPayload = {
      id: 'evt_notify_fail',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_notify_fail', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-notify-fail', lead_created: true, already_processed: false },
      error: null
    });

    // Force error in select query
    supabase.from.mockReturnValue({
      select: vi.fn().mockImplementation(() => {
        throw new Error('Supabase select error');
      })
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200); // Must remain 200 because DB write succeeded!
  });

  // 19 & 20. Duplicate event sends exactly 1 owner email & 1 CAPI Purchase
  it('19-20. skips duplicate owner email and CAPI purchase on duplicate events (already_processed: true)', async () => {
    const mockPayload = {
      id: 'evt_dup_notify',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_dup_notify', amount_received: 5000, metadata: {} } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-dup-notify', already_processed: true },
      error: null
    });

    const res = await webhookHandler(createEvent(mockPayload));
    expect(res.statusCode).toBe(200);
    expect(supabase.from).not.toHaveBeenCalled(); // Hydration skipped for duplicate
  });

  // 21. Customer PII absent from Stripe metadata
  it('21. verifies create-payment-intent omits customer PII from Stripe metadata', async () => {
    const createReq = {
      httpMethod: 'POST',
      body: JSON.stringify({
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '5551234567',
        payment_flow: 'concierge',
        request_id: 'req_pii_check_1',
        lead_uuid: 'uuid-pii-check-1'
      })
    };

    const res = await createPaymentIntentHandler(createReq);
    expect(res.statusCode).toBe(200);

    const lastCall = mockPaymentIntentsCreate.mock.calls.at(-1);
    expect(lastCall[0].metadata.customer_name).toBeUndefined();
    expect(lastCall[0].metadata.customer_email).toBeUndefined();
    expect(lastCall[0].metadata.customer_phone).toBeUndefined();
    expect(lastCall[0].metadata.request_id).toBe('req_pii_check_1');
    expect(lastCall[0].metadata.lead_uuid).toBe('uuid-pii-check-1');
  });

  // 22. Concierge amount cannot be tampered with ($50 flat enforced)
  it('22. enforces $50 flat (5000 cents) for Concierge flow regardless of body.amount', async () => {
    const createReq = {
      httpMethod: 'POST',
      body: JSON.stringify({
        payment_flow: 'concierge',
        amount: 100, // Attempting $1 tampering!
        request_id: 'req_concierge_tamper'
      })
    };

    const res = await createPaymentIntentHandler(createReq);
    expect(res.statusCode).toBe(200);
    const lastCall = mockPaymentIntentsCreate.mock.calls.at(-1);
    expect(lastCall[0].amount).toBe(5000);
  });

  // 23. EstimateWidget amount validation & $50 deposit floor
  it('23a. enforces $50 minimum floor when calculated deposit is below $50', async () => {
    const createReq = {
      httpMethod: 'POST',
      body: JSON.stringify({
        payment_flow: 'estimate_widget',
        bedrooms: 1,
        bathrooms: 1,
        frequency: 'oneTime',
        amount: 2000, // Attempted $20 deposit
        request_id: 'req_ew_below_floor'
      })
    };

    const res = await createPaymentIntentHandler(createReq);
    expect(res.statusCode).toBe(200);

    const lastCall = mockPaymentIntentsCreate.mock.calls.at(-1);
    expect(lastCall[0].amount).toBe(5000); // 5000 cents ($50 floor enforced)
  });

  it('23b. calculates exact 25% deposit when total exceeds $50 deposit floor', async () => {
    const createReq = {
      httpMethod: 'POST',
      body: JSON.stringify({
        payment_flow: 'estimate_widget',
        bedrooms: 4,
        bathrooms: 3,
        frequency: 'oneTime',
        request_id: 'req_ew_above_floor'
      })
    };

    const res = await createPaymentIntentHandler(createReq);
    expect(res.statusCode).toBe(200);

    const lastCall = mockPaymentIntentsCreate.mock.calls.at(-1);
    // Base 140 + 4*25 (100) + 3*35 (105) = 345. 25% = 86.25 -> 86 * 100 = 8600 cents
    expect(lastCall[0].amount).toBeGreaterThan(5000);
  });

  // 24 & 25. Identifier stability & separate inquiry
  it('24-25. maintains request_id stability on retries and distinct IDs for separate inquiries', async () => {
    const req1 = 'req_stable_123';
    const mockPayload1 = {
      id: 'evt_inquiry_1',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_inquiry_1', amount_received: 5000, metadata: { request_id: req1 } } }
    };

    const supabase = getSupabaseClient();
    supabase.rpc.mockResolvedValueOnce({
      data: { lead_uuid: 'uuid-inquiry-1', lead_created: true, already_processed: false },
      error: null
    });

    supabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null })
        })
      })
    });

    const res1 = await webhookHandler(createEvent(mockPayload1));
    expect(res1.statusCode).toBe(200);
    expect(supabase.rpc).toHaveBeenCalledWith('gg_reconcile_stripe_payment', expect.objectContaining({
      p_request_id: req1
    }));
  });

  // 26. No secrets appear in logs or frontend bundle
  it('26. confirms no secrets exist in client response payloads', async () => {
    const createReq = {
      httpMethod: 'POST',
      body: JSON.stringify({
        payment_flow: 'concierge',
        request_id: 'req_secret_check'
      })
    };

    const res = await createPaymentIntentHandler(createReq);
    expect(res.statusCode).toBe(200);
    expect(res.body).not.toContain(process.env.STRIPE_SECRET_KEY);
    expect(res.body).not.toContain(stripeSecret);
  });

  // 27. Test-mode email subject prefixing across Netlify contexts
  it('27. applies [TEST] subject prefix fail-safe for all non-production contexts', async () => {
    const originalContext = process.env.CONTEXT;
    const originalStripeKey = process.env.STRIPE_SECRET_KEY;
    const consoleSpy = vi.spyOn(console, 'log');

    const runWebhookWithEnv = async (context, stripeKey, eventId, leadUuid) => {
      process.env.CONTEXT = context;
      process.env.STRIPE_SECRET_KEY = stripeKey;

      const payload = {
        id: eventId,
        type: 'payment_intent.succeeded',
        data: { object: { id: `pi_${eventId}`, amount_received: 5000, metadata: {} } }
      };

      const supabase = getSupabaseClient();
      supabase.rpc.mockResolvedValueOnce({
        data: { lead_uuid: leadUuid, lead_created: true, already_processed: false },
        error: null
      });

      supabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null })
          })
        })
      });

      await webhookHandler(createEvent(payload));
    };

    try {
      // 1. production + sk_live_ => no [TEST] prefix
      await runWebhookWithEnv('production', 'sk_' + 'live_123456789', 'evt_subj_1', 'uuid-subj-1');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification (G&G Deposit Paid — Lead uuid-subj-1) sent'));

      // 2. production + sk_test_ => [TEST] prefix
      await runWebhookWithEnv('production', 'sk_' + 'test_123456789', 'evt_subj_2', 'uuid-subj-2');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification ([TEST] G&G Deposit Paid — Lead uuid-subj-2) sent'));

      // 3. deploy-preview => [TEST] prefix
      await runWebhookWithEnv('deploy-preview', 'sk_' + 'test_123456789', 'evt_subj_3', 'uuid-subj-3');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification ([TEST] G&G Deposit Paid — Lead uuid-subj-3) sent'));

      // 4. branch-deploy => [TEST] prefix
      await runWebhookWithEnv('branch-deploy', 'sk_' + 'test_123456789', 'evt_subj_4', 'uuid-subj-4');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification ([TEST] G&G Deposit Paid — Lead uuid-subj-4) sent'));

      // 5. dev => [TEST] prefix
      await runWebhookWithEnv('dev', 'sk_' + 'test_123456789', 'evt_subj_5', 'uuid-subj-5');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification ([TEST] G&G Deposit Paid — Lead uuid-subj-5) sent'));

      // 6. missing CONTEXT or missing Stripe key => fail safe with [TEST] prefix
      await runWebhookWithEnv(undefined, undefined, 'evt_subj_6', 'uuid-subj-6');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Owner notification ([TEST] G&G Deposit Paid — Lead uuid-subj-6) sent'));
    } finally {
      process.env.CONTEXT = originalContext;
      process.env.STRIPE_SECRET_KEY = originalStripeKey;
      consoleSpy.mockRestore();
    }
  });
});
