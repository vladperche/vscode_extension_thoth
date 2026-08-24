import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { ThothRequestData } from '../editor/ThothDocument.js';
import { parseThothVarsDocument } from '../editor/ThothVarsDocument.js';
import { getWorkspaceEnvironmentVariables } from './WorkspaceEnvService.js';
import { getDirectoryHierarchy } from './EnvironmentDiscovery.js';

export interface ResolveVariableResult {
  value?: string;
  error?: string;
}

export function resolveSingleVariable(
  varName: string,
  selectedEnv: string,
  documentUri: vscode.Uri
): ResolveVariableResult {
  const dirHierarchy = getDirectoryHierarchy(documentUri);
  const targetEnv = selectedEnv || '$shared';

  // 1. Search directory hierarchy for *.thothvars
  for (const dirPath of dirHierarchy) {
    if (!fs.existsSync(dirPath)) continue;

    try {
      const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.thothvars'));
      if (files.length === 0) continue;

      // Check selected environment in this folder
      const matchesEnv: { file: string; val: string }[] = [];
      const matchesShared: { file: string; val: string }[] = [];

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const parsed = parseThothVarsDocument(content);

          if (targetEnv !== '$shared' && parsed[targetEnv] && parsed[targetEnv][varName] !== undefined) {
            matchesEnv.push({ file, val: String(parsed[targetEnv][varName]) });
          }

          if (parsed['$shared'] && parsed['$shared'][varName] !== undefined) {
            matchesShared.push({ file, val: String(parsed['$shared'][varName]) });
          }
        } catch {
          // Ignore unparseable file
        }
      }

      // Conflict check for selectedEnv
      if (matchesEnv.length > 1) {
        return {
          error: `Conflict: Variable '${varName}' is defined multiple times for environment '${targetEnv}' in folder '${dirPath}'.`
        };
      }
      if (matchesEnv.length === 1) {
        return { value: matchesEnv[0].val };
      }

      // Conflict check for $shared
      if (matchesShared.length > 1) {
        return {
          error: `Conflict: Variable '${varName}' is defined multiple times for environment '$shared' in folder '${dirPath}'.`
        };
      }
      if (matchesShared.length === 1) {
        return { value: matchesShared[0].val };
      }

    } catch {
      // Ignore read errors
    }
  }

  // 2. Search .vscode/settings.json (thoth-client.environmentVariables)
  const workspaceVars = getWorkspaceEnvironmentVariables();
  if (targetEnv !== '$shared' && workspaceVars[targetEnv] && workspaceVars[targetEnv][varName] !== undefined) {
    return { value: String(workspaceVars[targetEnv][varName]) };
  }
  if (workspaceVars['$shared'] && workspaceVars['$shared'][varName] !== undefined) {
    return { value: String(workspaceVars['$shared'][varName]) };
  }

  // 3. Not found anywhere
  return {
    error: `Unresolved variable '{{${varName}}}' for environment '${targetEnv}'. Variable was not found in any *.thothvars files or .vscode/settings.json.`
  };
}

export function extractVariableNames(text: string): string[] {
  if (!text) return [];
  const matches = new Set<string>();
  const regex = /\{\{\s*([\w.-]+)\s*\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match[1]) matches.add(match[1]);
  }
  return Array.from(matches);
}

export function resolveVariablesInStringWithRules(
  text: string,
  selectedEnv: string,
  documentUri: vscode.Uri
): { result: string; error?: string } {
  if (!text) return { result: text };

  const varNames = extractVariableNames(text);
  let resolvedText = text;

  for (const varName of varNames) {
    const res = resolveSingleVariable(varName, selectedEnv, documentUri);
    if (res.error) {
      return { result: text, error: res.error };
    }
    const regex = new RegExp(`\\{\\{\\s*${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\}\\}`, 'g');
    resolvedText = resolvedText.replace(regex, res.value ?? '');
  }

  return { result: resolvedText };
}

export async function resolveRequestVariablesWithRules(
  request: ThothRequestData,
  selectedEnv: string,
  documentUri: vscode.Uri
): Promise<{ resolved?: ThothRequestData; error?: string }> {
  // Collect all text blocks to resolve
  const targetEnv = selectedEnv || '$shared';

  // 1. Resolve URL
  const urlRes = resolveVariablesInStringWithRules(request.url, targetEnv, documentUri);
  if (urlRes.error) return { error: urlRes.error };

  // 2. Resolve Query Params
  const resolvedQuery: Record<string, any> = {};
  if (request.query) {
    for (const [k, v] of Object.entries(request.query)) {
      const keyRes = resolveVariablesInStringWithRules(k, targetEnv, documentUri);
      if (keyRes.error) return { error: keyRes.error };

      let valResStr = String(v);
      if (typeof v === 'string') {
        const valRes = resolveVariablesInStringWithRules(v, targetEnv, documentUri);
        if (valRes.error) return { error: valRes.error };
        valResStr = valRes.result;
      }

      resolvedQuery[keyRes.result] = valResStr;
    }
  }

  // 3. Resolve Headers
  const resolvedHeaders: Record<string, string> = {};
  if (request.headers) {
    for (const [k, v] of Object.entries(request.headers)) {
      const keyRes = resolveVariablesInStringWithRules(k, targetEnv, documentUri);
      if (keyRes.error) return { error: keyRes.error };

      const valRes = resolveVariablesInStringWithRules(String(v), targetEnv, documentUri);
      if (valRes.error) return { error: valRes.error };

      resolvedHeaders[keyRes.result] = valRes.result;
    }
  }

  // 4. Resolve Body
  let resolvedBody: any = request.body;
  if (typeof request.body === 'string') {
    const bodyRes = resolveVariablesInStringWithRules(request.body, targetEnv, documentUri);
    if (bodyRes.error) return { error: bodyRes.error };
    resolvedBody = bodyRes.result;
  } else if (typeof request.body === 'object' && request.body !== null) {
    const jsonStr = JSON.stringify(request.body);
    const bodyRes = resolveVariablesInStringWithRules(jsonStr, targetEnv, documentUri);
    if (bodyRes.error) return { error: bodyRes.error };
    try {
      resolvedBody = JSON.parse(bodyRes.result);
    } catch {
      resolvedBody = bodyRes.result;
    }
  }

  return {
    resolved: {
      ...request,
      url: urlRes.result,
      query: resolvedQuery,
      headers: resolvedHeaders,
      body: resolvedBody
    }
  };
}
