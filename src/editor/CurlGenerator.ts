import { ThothRequestData } from './ThothDocument.js';

export function generateCurlCommand(data: ThothRequestData): string {
  const method = (data.method || 'GET').toUpperCase();
  
  // 1. Construct URL with Query Parameters
  let rawUrl = (data.url || '').trim();
  if (!rawUrl) {
    rawUrl = 'https://api.example.com/endpoint';
  }
  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = 'http://' + rawUrl;
  }

  let finalUrl = rawUrl;
  try {
    const urlObj = new URL(rawUrl);
    if (data.query && typeof data.query === 'object') {
      for (const [key, val] of Object.entries(data.query)) {
        if (key.trim() !== '') {
          urlObj.searchParams.append(key, String(val));
        }
      }
    }
    finalUrl = urlObj.toString();
  } catch {
    finalUrl = rawUrl;
  }

  const parts: string[] = [];
  parts.push(`curl -X ${method} "${finalUrl}"`);

  // 2. Add Headers
  const isFormUrlEncoded = data.headers && Object.entries(data.headers).some(
    ([k, v]) => k.toLowerCase() === 'content-type' && String(v).includes('x-www-form-urlencoded')
  );

  if (data.headers && typeof data.headers === 'object') {
    for (const [key, val] of Object.entries(data.headers)) {
      if (key.trim() !== '') {
        const escapedVal = String(val).replace(/"/g, '\\"');
        parts.push(`  -H "${key}: ${escapedVal}"`);
      }
    }
  }

  // 3. Add Body
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && data.body !== undefined && data.body !== null && data.body !== '') {
    let bodyString = '';
    if (isFormUrlEncoded && typeof data.body === 'object') {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data.body)) {
        params.append(k, String(v));
      }
      bodyString = params.toString();
    } else if (typeof data.body === 'object') {
      bodyString = JSON.stringify(data.body, null, 2);
    } else {
      bodyString = String(data.body);
    }

    // Escape single quotes for single-quoted string shell safety
    const safeBody = bodyString.replace(/'/g, "'\\''");
    parts.push(`  -d '${safeBody}'`);
  }

  return parts.join(' \\\n');
}
