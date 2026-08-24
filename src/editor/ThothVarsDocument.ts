export interface ThothVarsData {
  [envName: string]: Record<string, string>;
}

export function createDefaultThothVarsData(): ThothVarsData {
  return {
    "$shared": {}
  };
}

export function parseThothVarsDocument(content: string): ThothVarsData {
  const trimmed = content.trim();
  if (!trimmed) {
    return createDefaultThothVarsData();
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return createDefaultThothVarsData();
    }

    const result: ThothVarsData = {};
    
    // Guarantee $shared is first
    result["$shared"] = parsed["$shared"] && typeof parsed["$shared"] === 'object' && !Array.isArray(parsed["$shared"])
      ? parsed["$shared"]
      : {};

    for (const [key, val] of Object.entries(parsed)) {
      if (key !== "$shared" && typeof val === 'object' && val !== null && !Array.isArray(val)) {
        result[key] = val as Record<string, string>;
      }
    }

    return result;
  } catch {
    return createDefaultThothVarsData();
  }
}

export function serializeThothVarsDocument(data: ThothVarsData): string {
  const ordered: ThothVarsData = {};
  
  // Guarantee $shared is serialized first
  ordered["$shared"] = data["$shared"] || {};

  for (const [key, val] of Object.entries(data)) {
    if (key !== "$shared" && typeof val === 'object' && val !== null) {
      ordered[key] = val;
    }
  }

  return JSON.stringify(ordered, null, 4) + "\n";
}
