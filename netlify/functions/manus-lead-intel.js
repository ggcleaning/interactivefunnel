/**
 * G&G Cleaning Services - Manus AI Lead Intelligence
 * 
 * Analyzes incoming GHL leads using Manus AI to provide 
 * sales angles, priority, and follow-up suggestions.
 */

exports.handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // 1. Security Check (Optional Shared Secret)
        const WEBHOOK_SECRET = process.env.MANUS_WEBHOOK_SECRET;
        const incomingSecret = event.headers['x-webhook-secret'];

        if (WEBHOOK_SECRET) {
            if (incomingSecret !== WEBHOOK_SECRET) {
                console.warn('[Manus Intel] Unauthorized request: Missing or invalid x-webhook-secret header.');
                return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
            }
        } else {
            console.warn('[Manus Intel] Security Warning: MANUS_WEBHOOK_SECRET not set. Allowing request.');
        }

        const body = JSON.parse(event.body);

        // 2. Configuration
        const MANUS_API_KEY = process.env.MANUS_API_KEY;
        const MANUS_API_URL = process.env.MANUS_API_URL || 'https://api.manus.ai/v1/tasks'; // Placeholder

        if (!MANUS_API_KEY) {
            console.error('[Manus Intel] Missing MANUS_API_KEY environment variable.');
            return { 
                statusCode: 500, 
                body: JSON.stringify({ error: 'Manus API key not configured' }) 
            };
        }

        // 3. Construct Manus Prompt
        const prompt = `
You are a lead qualification and quote assistant for G&G Cleaning Services, a family-owned cleaning company serving Long Island.

Analyze the lead data and return only valid JSON.

Lead data:
${JSON.stringify(body, null, 2)}

Return JSON with this exact schema:
{
  "lead_priority": "hot | warm | cold",
  "service_classification": "standard_clean | deep_clean | move_in_out | commercial | airbnb_turnover | post_construction | organizing | unknown",
  "sales_angle": "string",
  "suggested_sms": "string",
  "internal_summary": "string",
  "missing_info": ["string"],
  "recommended_tags": ["string"],
  "next_best_action": "string"
}

Rules:
- Keep suggested_sms under 300 characters.
- Be practical and sales-focused.
- If timeline is ASAP/today/tomorrow/this week, prioritize as hot.
- If property type is commercial, classify as commercial.
- If service type is deep clean, classify as deep_clean.
- If move-in or move-out appears anywhere, classify as move_in_out.
- Only recommend tags from the approved tag list: [intent_hot, intent_warm, intent_cold, rush_job, type_residential, type_commercial, deep_clean, standard_clean, move_in_out, recurring_interest, high_value_lead, quote_needs_review].
- Return JSON only.
`;

        // 4. Call Manus API
        const response = await fetch(MANUS_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${MANUS_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                mode: 'speed'
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(`Manus API responded with ${response.status}: ${JSON.stringify(result)}`);
        }

        // Parse Manus result (assuming it returns the analysis in a specific field like 'output' or 'response')
        // Adjusting based on standard AI API expectations
        let analysis;
        try {
            // Manus output might be a string containing JSON or a direct object
            const rawContent = result.output || result.response || result.result;
            analysis = typeof rawContent === 'string' ? JSON.parse(rawContent) : rawContent;
        } catch (parseError) {
            console.error('[Manus Intel] Failed to parse Manus response as JSON:', result);
            throw new Error('Invalid analysis format from Manus');
        }

        console.log('[Manus Intel] Successfully analyzed lead:', body.email);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                analysis: analysis
            })
        };

    } catch (error) {
        console.error('[Manus Intel] Error:', error.message);

        // 5. Fallback Analysis
        const fallback = {
            lead_priority: "warm",
            service_classification: "unknown",
            sales_angle: "General cleaning inquiry",
            suggested_sms: `Hi ${JSON.parse(event.body).first_name || 'there'}, thanks for reaching out to G&G Cleaning. We received your request and can help you choose the right cleaning option.`,
            internal_summary: "Manus unavailable. Review lead manually.",
            missing_info: [],
            recommended_tags: ["intent_warm", "quote_needs_review"],
            next_best_action: "Manual review"
        };

        return {
            statusCode: 200, // Return 200 even on fallback to prevent GHL workflow error
            body: JSON.stringify({
                success: false,
                error: "Manus request failed",
                fallback_analysis: fallback
            })
        };
    }
};
