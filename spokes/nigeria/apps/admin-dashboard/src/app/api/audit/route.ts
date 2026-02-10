// Netlify optimization: prevent caching of audit results
export const dynamic = 'force-dynamic';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sovryn-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

function jsonResponse(body: object, status: number, headers?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...headers,
    },
  });
}

export async function OPTIONS() {
  return new Response('ok', { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  // SECURE SOVRYN API GATEKEEPER: validate Sovereign Signature at the very beginning
  const providedKey = request.headers.get('x-sovryn-key');
  const masterSecret = process.env.SOVRYN_SECRET;

  if (!providedKey || providedKey !== masterSecret) {
    return new Response('Unauthorized: Sovereign Signature Missing', {
      status: 401,
      headers: { ...CORS_HEADERS },
    });
  }

  console.log('Sovereign Signature Verified. Starting Audit.');
  console.log('SOVRYN AUDIT RECEIVED FROM SUPABASE');

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  const apiKey = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY;

  if (!apiUrl || !apiKey) {
    return jsonResponse(
      {
        success: false,
        error: 'Server misconfiguration',
        message: 'API URL or API key not configured',
      },
      500
    );
  }

  try {
    const res = await fetch(`${apiUrl}/v1/sovryn/audit-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
        'x-sovryn-key': providedKey,
      },
    });
    const data = await res.json().catch(() => ({}));
    return jsonResponse(data, res.status);
  } catch (e) {
    return jsonResponse(
      {
        success: false,
        message: e instanceof Error ? e.message : 'Audit request failed',
      },
      500
    );
  }
}
