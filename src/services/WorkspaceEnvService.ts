import * as vscode from 'vscode';
import { ThothVarsData } from '../editor/ThothVarsDocument.js';

export function getWorkspaceEnvironmentVariables(): ThothVarsData {
  const config = vscode.workspace.getConfiguration('thoth-client');
  const envVars = config.get<ThothVarsData>('environmentVariables') || {};
  
  const result: ThothVarsData = {
    "$shared": {}
  };

  if (envVars["$shared"] && typeof envVars["$shared"] === 'object') {
    result["$shared"] = { ...envVars["$shared"] };
  }

  for (const [envName, vars] of Object.entries(envVars)) {
    if (envName !== "$shared" && typeof vars === 'object' && vars !== null) {
      result[envName] = { ...vars };
    }
  }

  return result;
}
