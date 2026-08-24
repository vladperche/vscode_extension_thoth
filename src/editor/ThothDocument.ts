export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface ThothRequestData {
  name: string;
  method: string;
  url: string;
  query: Record<string, any>;
  headers: Record<string, string>;
  body: any;
}

export function createDefaultThothRequest(): ThothRequestData {
  return {
    name: "New Request",
    method: "GET",
    url: "https://api.example.com/endpoint",
    query: {},
    headers: {
      "Content-Type": "application/json"
    },
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
    return {
      name: typeof parsed.name === 'string' ? parsed.name : 'Request',
      method: typeof parsed.method === 'string' ? parsed.method.toUpperCase() : 'GET',
      url: typeof parsed.url === 'string' ? parsed.url : '',
      query: parsed.query && typeof parsed.query === 'object' && !Array.isArray(parsed.query) ? parsed.query : {},
      headers: parsed.headers && typeof parsed.headers === 'object' && !Array.isArray(parsed.headers) ? parsed.headers : {},
      body: parsed.body !== undefined ? parsed.body : null
    };
  } catch (err) {
    return createDefaultThothRequest();
  }
}

export function serializeThothDocument(data: ThothRequestData): string {
  const cleanData: any = {
    name: data.name || "Request",
    method: data.method ? data.method.toUpperCase() : "GET",
    url: data.url || "",
    query: data.query || {},
    headers: data.headers || {}
  };

  if (data.body !== undefined && data.body !== "") {
    cleanData.body = data.body;
  } else if (data.body === "") {
    cleanData.body = "";
  }

  return JSON.stringify(cleanData, null, 4) + "\n";
}
