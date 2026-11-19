export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ThothQueryParam {
  key: string;
  value: string;
  enabled?: boolean;
}

export type ThothBodyType = 'json' | 'text' | 'urlencoded' | 'none';

export interface ThothRequestData {
  name: string;
  method: string;
  url: string;
  query: ThothQueryParam[];
  headers: Record<string, string>;
  bodyType: ThothBodyType;
  body: any;
}

export function normalizeBodyType(
  rawBodyType: any,
  headers?: Record<string, string>,
  body?: any
): ThothBodyType {
  if (typeof rawBodyType === 'string') {
    const normalized = rawBodyType.trim().toLowerCase();
    if (normalized === 'json' || normalized === 'application/json') {
      return 'json';
    }
    if (
      normalized === 'text' ||
      normalized === 'raw' ||
      normalized === 'text/raw' ||
      normalized === 'text / raw' ||
      normalized === 'text/plain'
    ) {
      return 'text';
    }
    if (
      normalized === 'urlencoded' ||
      normalized === 'x-www-form-urlencoded' ||
      normalized === 'application/x-www-form-urlencoded'
    ) {
      return 'urlencoded';
    }
    if (normalized === 'none') {
      return 'none';
    }
  }

  const contentTypeEntry =
    headers && typeof headers === 'object'
      ? Object.entries(headers).find(([k]) => k.trim().toLowerCase() === 'content-type')
      : undefined;
  const contentType = contentTypeEntry ? String(contentTypeEntry[1]).toLowerCase() : '';

  if (contentType.includes('x-www-form-urlencoded')) {
    return 'urlencoded';
  }

  if (body === null || body === undefined) {
    return 'none';
  }

  if (typeof body === 'object') {
    return 'json';
  }

  if (contentType.includes('json')) {
    return 'json';
  }

  return 'text';
}

export function normalizeQueryParams(rawQuery: any): ThothQueryParam[] {
  if (Array.isArray(rawQuery)) {
    const result: ThothQueryParam[] = [];
    for (const item of rawQuery) {
      if (item && typeof item === 'object') {
        const key = typeof item.key === 'string'
          ? item.key
          : (typeof item.name === 'string' ? item.name : '');
        const value = item.value !== undefined && item.value !== null ? String(item.value) : '';
        const enabled = item.enabled !== undefined ? Boolean(item.enabled) : true;
        result.push({ key, value, enabled });
      }
    }
    return result;
  }

  if (rawQuery && typeof rawQuery === 'object') {
    const result: ThothQueryParam[] = [];
    for (const [k, v] of Object.entries(rawQuery)) {
      if (Array.isArray(v)) {
        for (const el of v) {
          result.push({
            key: k,
            value: el !== undefined && el !== null ? String(el) : '',
            enabled: true
          });
        }
      } else {
        result.push({
          key: k,
          value: v !== undefined && v !== null ? String(v) : '',
          enabled: true
        });
      }
    }
    return result;
  }

  return [];
}

export function createDefaultThothRequest(): ThothRequestData {
  return {
    name: "New Request",
    method: "GET",
    url: "https://api.example.com/endpoint",
    query: [],
    headers: {
      "Content-Type": "application/json"
    },
    bodyType: "none",
    body: null
  };
}

export function parseThothDocument(content: string): ThothRequestData {
  const trimmed = content.trim();
  if (!trimmed) {
    return createDefaultThothRequest();
  }

  try {
    const parsed = JSON.parse(trimmed);
    const headers = parsed.headers && typeof parsed.headers === 'object' && !Array.isArray(parsed.headers) ? parsed.headers : {};
    const body = parsed.body !== undefined ? parsed.body : null;
    return {
      name: typeof parsed.name === 'string' ? parsed.name : 'Request',
      method: typeof parsed.method === 'string' ? parsed.method.toUpperCase() : 'GET',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      query: normalizeQueryParams(parsed.query),
      headers,
      bodyType: normalizeBodyType(parsed.bodyType, headers, body),
      body
    };
  } catch (err) {
    return createDefaultThothRequest();
  }
}

export function serializeThothDocument(data: ThothRequestData): string {
  const serializedQuery = normalizeQueryParams(data.query)
    .filter(item => item.key.trim() !== '')
    .map(item => {
      const entry: ThothQueryParam = {
        key: item.key.trim(),
        value: item.value
      };
      if (item.enabled === false) {
        entry.enabled = false;
      }
      return entry;
    });

  const headers = data.headers || {};
  const bodyType = normalizeBodyType(data.bodyType, headers, data.body);

  const cleanData: any = {
    name: data.name || "Request",
    method: data.method ? data.method.toUpperCase() : "GET",
    url: data.url || "",
    query: serializedQuery,
    headers,
    bodyType
  };

  if (data.body !== undefined) {
    cleanData.body = data.body;
  }

  return JSON.stringify(cleanData, null, 4) + "\n";
}
