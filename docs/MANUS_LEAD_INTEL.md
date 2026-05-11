# G&G Cleaning — Manus AI Lead Intelligence

This Netlify function provides an AI-driven analysis of incoming leads to help the G&G Cleaning team prioritize and quote more effectively.

## Endpoint Details
- **URL:** `https://ggcleaningli.com/.netlify/functions/manus-lead-intel`
- **Method:** `POST`
- **Auth (Optional):** Header `x-webhook-secret`

## Required Environment Variables
- `MANUS_API_KEY`: Your Manus API Key.
- `MANUS_API_URL`: The Manus API endpoint (Defaults to `https://api.manus.ai/v1/tasks`).
- `MANUS_WEBHOOK_SECRET`: (Optional) Shared secret for securing the endpoint.

## Sample GHL Webhook Payload
Configure a GHL workflow to send a "Web Request" with this JSON body:

```json
{
  "contact_id": "{{contact.id}}",
  "opportunity_id": "{{opportunity.id}}",
  "source": "{{contact.source}}",
  "first_name": "{{contact.first_name}}",
  "last_name": "{{contact.last_name}}",
  "phone": "{{contact.phone}}",
  "email": "{{contact.email}}",
  "service_type": "{{contact.service_type}}",
  "property_type": "{{contact.property_type}}",
  "bedrooms": "{{contact.bedrooms}}",
  "bathrooms": "{{contact.bathrooms}}",
  "square_footage": "{{contact.square_footage}}",
  "zip_code": "{{contact.zip_code}}",
  "timeline": "{{contact.timeline}}",
  "notes": "{{contact.notes}}",
  "quote_amount": "{{contact.quote_amount}}"
}
```

## Sample Successful Response
```json
{
  "success": true,
  "analysis": {
    "lead_priority": "hot",
    "service_classification": "move_in_out",
    "sales_angle": "Urgent move-in deep clean for residential lead.",
    "suggested_sms": "Hi Jane, we can definitely handle that deep clean before you move in! We have an opening this Friday. Would you like me to lock that in?",
    "internal_summary": "High priority residential move-in. Zip code 11743. Needs quote confirmed.",
    "missing_info": [],
    "recommended_tags": ["intent_hot", "rush_job", "move_in_out"],
    "next_best_action": "Call lead immediately to confirm Friday slot."
  }
}
```

## GHL Workflow Placement
1. **Trigger:** Form Submitted / Lead Form Submitted.
2. **Action:** Create/Update Contact.
3. **Action:** Webhook (POST to this endpoint).
4. **Action:** (Optional) If/Else based on `lead_priority` returned in response.
5. **Action:** Add tags from `recommended_tags`.

## Fallback Logic
If the Manus API is unreachable or fails to parse, the function returns a `success: false` flag with a `fallback_analysis` object containing safe, generic values to ensure the GHL workflow does not break.
