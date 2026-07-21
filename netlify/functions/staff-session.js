import { requireStaffAuth } from './utils/requireStaffAuth.js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Enforce staff authentication via JWT bearer token
  const authResult = await requireStaffAuth(event);
  if (!authResult.authorized) {
    return {
      statusCode: authResult.statusCode || 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: authResult.error || 'Unauthorized' })
    };
  }

  const { userContext } = authResult;

  // Return safe session response (NO tokens, NO secrets, NO raw PII)
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      authenticated: true,
      staff: {
        user_id: userContext.userId,
        email: userContext.email,
        display_name: userContext.displayName,
        role: userContext.role
      }
    })
  };
};
