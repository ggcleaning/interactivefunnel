/**
 * G&G Cleaning Services - Lead Capture Utility
 * Connects the frontend to GHL via Webhooks.
 * 
 * Includes Meta CAPI deduplication support:
 * - Automatically reads _fbp and _fbc cookies
 * - Passes event_id through to GHL so server matches browser events
 */

import { getFbp, getFbc } from './metaTracking';

const BOOKING_WEBHOOK_URL = import.meta.env.VITE_GHL_BOOKING_WEBHOOK_URL || import.meta.env.VITE_GHL_WEBHOOK_URL;
const QUOTE_WEBHOOK_URL = import.meta.env.VITE_GHL_QUOTE_WEBHOOK_URL;
const FB_ADS_WEBHOOK_URL = import.meta.env.VITE_GHL_FB_ADS_WEBHOOK_URL;
const INTERNAL_WEBHOOK_URL = import.meta.env.VITE_GHL_INTERNAL_WEBHOOK_URL;

/**
 * Sends lead or booking data to the configured Webhook (GHL).
 * Automatically enriches every payload with fbp, fbc, and event_id
 * for Meta CAPI deduplication.
 * 
 * @param {Object} data - The payload to send (event_id should be included for dedup).
 * @param {string} type - The type of event (e.g., 'lead_capture', 'booking_confirmed').
 */
export const sendToCRM = async (data, type = 'lead_capture') => {
    // Check if the lead came from Facebook (stored in sessionStorage by App.jsx)
    const storedSource = typeof window !== 'undefined' ? sessionStorage.getItem('lead_source') : null;
    const isFacebook = storedSource === 'facebook' || data.source === 'facebook';

    // Select the correct webhook based on the event type and source
    let webhookUrl = BOOKING_WEBHOOK_URL;

    if (type === 'lead_capture' || type === 'quote_request' || type === 'photo_quote' || type === 'commercial_quote') {
        if (isFacebook && FB_ADS_WEBHOOK_URL) {
            webhookUrl = FB_ADS_WEBHOOK_URL;
        } else {
            webhookUrl = QUOTE_WEBHOOK_URL || import.meta.env.VITE_GHL_WEBHOOK_URL || BOOKING_WEBHOOK_URL;
        }
    }

    if (!webhookUrl) {
        console.error(`[Lead Capture] FATAL: No webhook URL configured for event type: ${type}.`, data);
        return { success: false, error: 'No webhook URL' };
    }

    // ── Meta CAPI Enrichment ──────────────────────────────────────────────────
    const fbp = data.fbp || getFbp();
    const fbc = data.fbc || getFbc();

    // ── GHL Field Mirroring ───────────────────────────────────────────────────
        const enrichedData = {
        ...data,
        "Full Name": data.name || data.contactName,
        "Full name": data.name || data.contactName,
        "Phone number": data.phone,
        "Phone Number": data.phone,
        "Email Address": data.email,
        "Email": data.email,
        "Business Name": data.businessName,
        "Property Type": data.propertyType || data.commercialPropertyType,
        "Facility Type": data.commercialPropertyType,
        "Square Footage": data.sqft,
        "Cleaning Frequency": data.commercialFrequency || data.frequency,
        "Target Visit Price": data.quoteTotal || data.perVisitTotal,
        "Total Monthly Value": data.monthlyTotal,
        "Value": data.value || data.quoteTotal || (type === 'lead_capture' ? 180 : 0),
        "Currency": data.currency || 'USD',
        "value": data.value || data.quoteTotal || (type === 'lead_capture' ? 180 : 0),
        "currency": data.currency || 'USD',
        "campaign": data.utm_campaign || data.campaign,
        "adset": data.ad_set || data.adset,
        "content": data.utm_content || data.content,
        "source": data.source || 'GG Cleaning Website',
        "event_type": type,
        "timestamp": new Date().toISOString(),
        "fbp": fbp || undefined,
        "fbc": fbc || undefined,
        "tags": [
            ...(data.tags || []),
            ...(type === 'commercial_quote' ? ['Commercial-Quote'] : [])
        ],
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrichedData),
        });

        if (!response.ok) {
            throw new Error(`Webhook error: ${response.statusText}`);
        }

        console.log(`[Lead Capture] Successfully sent ${type} event to ${webhookUrl.split('/').pop()}`, { 
            name: data.name || data.contactName,
            email: data.email
        });

        // Option 1: Fire standard frontend Facebook Pixel event
        if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('track', 'Lead', {
                value: enrichedData.value,
                currency: 'USD'
            });
            console.log('[Meta Pixel] Fired frontend Lead event');
        }

        // Option 2: Fire Server-Side API Event (Facebook Conversions API)
        // We trigger our Netlify background function to securely send the payload
        try {
            // Helper to extract cookies for advanced matching (fbp, fbc)
            const getCookie = (name) => {
                if (typeof document === 'undefined') return null;
                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                return match ? match[2] : null;
            };

            const fullName = data.name || data.contactName || '';
            const nameParts = fullName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            fetch('/.netlify/functions/fb-capi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    phone: data.phone,
                    firstName: firstName,
                    lastName: lastName,
                    city: data.city || '',
                    state: data.state || '',
                    zip: data.zipCode || data.zip || '',
                    fbp: getCookie('_fbp'),
                    fbc: getCookie('_fbc'),
                    value: enrichedData.value,
                    event_type: type
                })
            }).catch(err => console.error('[FB CAPI] Background fetch failed', err));
        } catch (e) {
            // Non-blocking error
        }

        return { success: true };
    } catch (error) {
        console.error('[Lead Capture] Error sending data:', error);
        return { success: false, error: error.message };
    }
};

// Maintain compatibility for older imports
export const sendToGHL = sendToCRM;

/**
 * Sends an internal staff quote to the dedicated GHL internal webhook.
 * This keeps internal quotes separate from public website leads in CRM.
 * Also logs to console for debugging.
 *
 * @param {Object} quoteData - Full quote payload from the internal quote desk.
 * @param {string} eventType - 'internal_quote' | 'override_audit' | 'deposit_initiated'
 */
export const sendInternalQuote = async (quoteData, eventType = 'internal_quote') => {
    const webhookUrl = INTERNAL_WEBHOOK_URL || BOOKING_WEBHOOK_URL;

    if (!webhookUrl) {
        console.error('[Internal Quote] FATAL: No webhook URL configured. Set VITE_GHL_INTERNAL_WEBHOOK_URL.', quoteData);
        return { success: false, error: 'No webhook URL configured' };
    }

    const payload = {
        ...quoteData,
        "Full Name": `${quoteData.firstName} ${quoteData.lastName}`,
        "Email": quoteData.email,
        "Phone": quoteData.phone,
        "Business Name": quoteData.businessName,
        "Facility Type": quoteData.commercialPropertyType,
        "Square Footage": quoteData.sqft,
        "Cleaning Frequency": quoteData.commercialFrequency || quoteData.frequency,
        "Target Visit Price": quoteData.quoteTotal,
        "Total Monthly Value": quoteData.monthlyTotal,
        "Value": quoteData.quoteTotal || 0,
        "Currency": 'USD',
        "value": quoteData.quoteTotal || 0,
        "currency": 'USD',
        booking_source: 'Internal Quote Desk',
        event_type: eventType,
        timestamp: new Date().toISOString(),
        location_id: 'D5WYnc5CK01FskhJtW3W',
        tags: [
            'Internal-Quote',
            'Staff-Submitted',
            ...(quoteData.overrideUsed ? ['Override-Used', `Override-${quoteData.priorityOverrideUsed}`] : []),
            ...(quoteData.couponCodeUsed ? [`Coupon-${quoteData.couponCodeUsed}`] : []),
            ...(eventType === 'send_proposal' ? ['trigger-commercial-proposal'] : []),
            ...(quoteData.tags || []),
        ],
    };

    // Always console log for debugging
    console.log(`[Internal Quote Desk] ${eventType.toUpperCase()} payload:`, payload);

    if (quoteData.overrideUsed) {
        console.warn(
            `[OVERRIDE AUDIT] Code "${quoteData.priorityOverrideUsed}" used by "${quoteData.internalQuotedBy}" for ${quoteData.firstName} ${quoteData.lastName} on ${quoteData.preferredDate}`,
            { overrideCode: quoteData.priorityOverrideUsed, quotedBy: quoteData.internalQuotedBy }
        );
    }

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`GHL webhook error: ${response.statusText}`);
        }

        console.log(`[Internal Quote Desk] Successfully sent ${eventType} to GHL`, {
            customer: `${quoteData.firstName} ${quoteData.lastName}`,
            total: quoteData.quoteTotal,
            override: quoteData.priorityOverrideUsed || 'none',
        });

        return { success: true };
    } catch (error) {
        console.error('[Internal Quote Desk] Error sending to GHL:', error);
        return { success: false, error: error.message };
    }
};
