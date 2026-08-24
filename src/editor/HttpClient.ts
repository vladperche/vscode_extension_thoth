import { ThothRequestData } from './ThothDocument.js';

export interface ThothHttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
  body: any;
  contentType: string;
  sizeBytes: number;
  error?: string;
}

export async function executeThothRequest(request: ThothRequestData): Promise<ThothHttpResponse> {
  const startTime = performance.now();

  try {
    // 1. Build URL with query params
    let rawUrl = request.url.trim();
    if (!rawUrl) {
      throw new Error("URL cannot be empty");
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'http://' + rawUrl;
    }

    // Allow self-signed TLS certificates for local HTTPS development
    if (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1')) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    const urlObj = new URL(rawUrl);

    if (request.query && typeof request.query === 'object') {
      for (const [key, value] of Object.entries(request.query)) {
        if (key.trim() !== '') {
          urlObj.searchParams.append(key, String(value));
        }
      }
    }

    // 2. Build headers
    const headersInit: Record<string, string> = {};
    if (request.headers && typeof request.headers === 'object') {
      for (const [key, value] of Object.entries(request.headers)) {
        if (key.trim() !== '') {
          headersInit[key] = String(value);
        }
      }
    }

    // 3. Build Body & Method
    const method = (request.method || 'GET').toUpperCase();
    let bodyPayload: string | undefined = undefined;

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && request.body !== undefined && request.body !== null && request.body !== '') {
      if (typeof request.body === 'object') {
        bodyPayload = JSON.stringify(request.body);
        if (!Object.keys(headersInit).some(k => k.toLowerCase() === 'content-type')) {
          headersInit['Content-Type'] = 'application/json';
        }
      } else {
        bodyPayload = String(request.body);
      }
    }

    // 4. Fetch Execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const fetchOptions: RequestInit = {
      method,
      headers: headersInit,
      body: bodyPayload,
      signal: controller.signal
    };

    const response = await fetch(urlObj.toString(), fetchOptions);
    clearTimeout(timeoutId);

    const durationMs = Math.round(performance.now() - startTime);

    // 5. Parse Response Headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();
    const sizeBytes = new TextEncoder().encode(rawText).length;

    let parsedBody: any = rawText;
    if (contentType.includes('application/json') || contentType.includes('text/json')) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    } else {
      const trimmed = rawText.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          parsedBody = JSON.parse(rawText);
        } catch {
          parsedBody = rawText;
        }
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
      durationMs,
      headers: responseHeaders,
      body: parsedBody,
      contentType,
      sizeBytes
    };

  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    const isTimeout = err.name === 'AbortError';
    const errMessage = isTimeout ? 'Timeout (30s)' : `Fetch failed: ${err.message || String(err)}`;

    return {
      ok: false,
      status: 0,
      statusText: isTimeout ? 'Timeout (30s)' : 'Fetch Error',
      durationMs,
      headers: {},
      body: `${errMessage}\n\nTroubleshooting:\n- Check if the target server is running and accessible at the requested URL.\n- Verify port numbers and network connection.`,
      contentType: 'text/plain',
      sizeBytes: 0,
      error: errMessage
    };
  }
}
