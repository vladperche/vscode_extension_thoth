import { ThothRequestData, normalizeQueryParams, normalizeBodyType } from './ThothDocument.js';

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
    for (const param of normalizeQueryParams(data.query)) {
      if (param.enabled !== false && param.key.trim() !== '') {
        urlObj.searchParams.append(param.key.trim(), String(param.value));
      }
    }
    finalUrl = urlObj.toString();
  } catch {
    finalUrl = rawUrl;
  }

  const parts: string[] = [];
  parts.push(`curl -X ${method} "${finalUrl}"`);

  // 2. Add Headers
  if (data.headers && typeof data.headers === 'object') {
    for (const [key, val] of Object.entries(data.headers)) {
      if (key.trim() !== '') {
        const escapedVal = String(val).replace(/"/g, '\\"');
        parts.push(`  -H "${key}: ${escapedVal}"`);
      }
    }
  }

  // 3. Add Body
  const bodyType = normalizeBodyType(data.bodyType, data.headers, data.body);
  if (!['GET', 'HEAD'].includes(method) && bodyType !== 'none' && data.body !== undefined && data.body !== null && data.body !== '') {
    let bodyString = '';
    if (bodyType === 'urlencoded') {
      if (typeof data.body === 'object') {
        const params = new URLSearchParams();
        for (const [k, v] of Object.entries(data.body)) {
          if (k.trim() !== '') {
            params.append(k, String(v));
          }
        }
        bodyString = params.toString();
      } else {
        bodyString = String(data.body);
      }
    } else if (bodyType === 'json') {
      bodyString = typeof data.body === 'string'
        ? data.body
        : JSON.stringify(data.body, null, 2);
    } else {
      bodyString = typeof data.body === 'object'
        ? JSON.stringify(data.body)
        : String(data.body);
    }

    if (bodyString !== '') {
      // Escape single quotes for single-quoted string shell safety
      const safeBody = bodyString.replace(/'/g, "'\\''");
      parts.push(`  -d '${safeBody}'`);
    }
  }

  return parts.join(' \\\n');
}
