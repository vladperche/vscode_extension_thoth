import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseThothVarsDocument } from '../editor/ThothVarsDocument.js';
import { getWorkspaceEnvironmentVariables } from './WorkspaceEnvService.js';

export function getDirectoryHierarchy(documentUri: vscode.Uri): string[] {
  const dirs: string[] = [];
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(documentUri);
  
  let currentDir = path.dirname(documentUri.fsPath);
  const rootDir = workspaceFolder ? workspaceFolder.uri.fsPath : currentDir;

  while (true) {
    dirs.push(currentDir);
    if (currentDir === rootDir || path.dirname(currentDir) === currentDir) {
      break;
    }
    // Safety check if document is outside workspace root
    if (workspaceFolder && !currentDir.startsWith(rootDir)) {
      break;
    }
    currentDir = path.dirname(currentDir);
  }

  return dirs;
}

export async function discoverEnvironments(documentUri: vscode.Uri): Promise<string[]> {
  const envSet = new Set<string>();
  envSet.add('$shared');

  const dirHierarchy = getDirectoryHierarchy(documentUri);

  for (const dirPath of dirHierarchy) {
    try {
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          if (file.endsWith('.thothvars')) {
            const filePath = path.join(dirPath, file);
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              const parsed = parseThothVarsDocument(content);
              for (const envKey of Object.keys(parsed)) {
                if (envKey.trim()) {
                  envSet.add(envKey.trim());
                }
              }
            } catch {
              // Ignore invalid files
            }
          }
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  // Also include environment names from .vscode/settings.json
  const workspaceVars = getWorkspaceEnvironmentVariables();
  for (const envKey of Object.keys(workspaceVars)) {
    if (envKey.trim()) {
      envSet.add(envKey.trim());
    }
  }

  const result = Array.from(envSet);
  // Ensure $shared is first
  const sharedIdx = result.indexOf('$shared');
  if (sharedIdx > 0) {
    result.splice(sharedIdx, 1);
    result.unshift('$shared');
  }

  return result;
}
